import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Exam, Section, Question, ExamAttempt, Result } from '../types';

export const useExam = (examId?: string) => {
    const queryClient = useQueryClient();

    const fetchExamDetails = async () => {
        if (!examId) return null;

        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();

        if (error) throw error;
        return data as Exam;
    };

    const fetchExamQuestions = async () => {
        if (!examId) return null;

        // Fetch sections with questions and options
        const { data: sections, error } = await supabase
            .from('sections')
            .select(`
                *,
                questions (
                    *,
                    options (*)
                )
            `)
            .eq('exam_id', examId)
            .order('section_order', { ascending: true });

        if (error) throw error;

        // Sort questions and options
        const sortedSections = sections.map((section: any) => ({
            ...section,
            questions: section.questions
                .sort((a: any, b: any) => (a.question_order || 0) - (b.question_order || 0))
                .map((question: any) => ({
                    ...question,
                    options: question.options.sort((a: any, b: any) => a.option_order - b.option_order)
                }))
        }));

        return sortedSections as Section[];
    };

    const checkExamEligibility = async (studentId: string) => {
        if (!examId) return { eligible: false, message: "Invalid Exam ID" };

        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('max_attempts, start_time, end_time')
            .eq('id', examId)
            .single();

        if (examError) throw examError;

        // Check exam date/time availability
        const now = new Date();

        if (exam.start_time) {
            const startTime = new Date(exam.start_time);
            if (now < startTime) {
                return {
                    eligible: false,
                    reason: 'upcoming',
                    message: `This exam will be available from ${startTime.toLocaleString()}`,
                    startTime: startTime
                };
            }
        }

        if (exam.end_time) {
            const endTime = new Date(exam.end_time);
            if (now > endTime) {
                return {
                    eligible: false,
                    reason: 'expired',
                    message: `This exam ended on ${endTime.toLocaleString()}`,
                    endTime: endTime
                };
            }
        }

        // Check LESSON-based prerequisite (quiz lessons only)
        // 1. Find the lesson containing this exam
        const { data: currentLesson } = await supabase
            .from('lessons')
            .select('id, title, prerequisite_lesson_id, sequential_unlock_enabled, content_type, exam_id')
            .eq('exam_id', examId)
            .eq('content_type', 'quiz')
            .limit(1)
            .maybeSingle();

        // 2. Check if this lesson has sequential unlock enabled and a prerequisite
        if (currentLesson?.sequential_unlock_enabled &&
            currentLesson.prerequisite_lesson_id &&
            currentLesson.prerequisite_lesson_id !== currentLesson.id) {

            // 3. Get the prerequisite lesson and its exam
            const { data: prereqLesson } = await supabase
                .from('lessons')
                .select('id, title, exam_id')
                .eq('id', currentLesson.prerequisite_lesson_id)
                .single();

            if (prereqLesson?.exam_id) {
                // Safeguard: If the prerequisite points to the SAME exam, ignore it
                if (prereqLesson.exam_id !== examId) {
                    // 4. Check if student has completed the prerequisite lesson's exam
                    const { data: prerequisiteAttempts } = await supabase
                        .from('exam_attempts')
                        .select('id, status')
                        .eq('exam_id', prereqLesson.exam_id)
                        .eq('student_id', studentId)
                        .eq('status', 'submitted');

                    if (!prerequisiteAttempts || prerequisiteAttempts.length === 0) {
                        return {
                            eligible: false,
                            reason: 'prerequisite',
                            message: 'You must complete the previous quiz first',
                            prerequisiteTitle: prereqLesson.title || 'Previous Quiz'
                        };
                    }
                }
            }
        }

        // Check max attempts
        if (exam.max_attempts) {
            const { count, error: countError } = await supabase
                .from('exam_attempts')
                .select('*', { count: 'exact', head: true })
                .eq('exam_id', examId)
                .eq('student_id', studentId)
                .eq('status', 'submitted');

            if (countError) throw countError;

            if ((count || 0) >= exam.max_attempts) {
                return { eligible: false, message: `You have used all ${exam.max_attempts} attempts.` };
            }
            return { eligible: true, remainingAttempts: exam.max_attempts - (count || 0) };
        }

        return { eligible: true, remainingAttempts: Infinity };
    };

    const startAttempt = async (studentId: string) => {
        if (!examId) throw new Error("Exam ID is required");

        // Check for existing in-progress attempt
        const { data: existingAttempt } = await supabase
            .from('exam_attempts')
            .select('*')
            .eq('exam_id', examId)
            .eq('student_id', studentId)
            .eq('status', 'in_progress')
            .single();

        if (existingAttempt) {
            return existingAttempt as ExamAttempt;
        }

        const { data, error } = await supabase
            .from('exam_attempts')
            .insert({
                exam_id: examId,
                student_id: studentId,
                status: 'in_progress',
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return data as ExamAttempt;
    };

    const saveResponse = async ({ attemptId, questionId, answer, isMarkedForReview }: {
        attemptId: string,
        questionId: string,
        answer: any,
        isMarkedForReview?: boolean
    }) => {
        // Handle array answers for MSQ
        const studentAnswer = Array.isArray(answer) ? JSON.stringify(answer) : String(answer);

        // Check if response exists
        const { data: existingResponse } = await supabase
            .from('responses')
            .select('id')
            .eq('attempt_id', attemptId)
            .eq('question_id', questionId)
            .single();

        if (existingResponse) {
            const updateData: any = { student_answer: studentAnswer };
            if (isMarkedForReview !== undefined) {
                updateData.is_marked_for_review = isMarkedForReview;
            }

            const { error } = await supabase
                .from('responses')
                .update(updateData)
                .eq('id', existingResponse.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('responses')
                .insert({
                    attempt_id: attemptId,
                    question_id: questionId,
                    student_answer: studentAnswer,
                    is_marked_for_review: isMarkedForReview || false
                });
            if (error) throw error;
        }
    };

    const submitAttempt = async ({ attemptId }: { attemptId: string }) => {
        // Update attempt status
        const { data: attempt, error: attemptError } = await supabase
            .from('exam_attempts')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString(),
            })
            .eq('id', attemptId)
            .select()
            .single();

        if (attemptError) throw attemptError;

        // Generate results
        try {
            // Fetch exam details
            const { data: examData, error: examError } = await supabase
                .from('exams')
                .select('id, total_marks')
                .eq('id', attempt.exam_id)
                .single();

            if (examError) throw examError;

            // Fetch all sections with questions and options
            const { data: sections, error: sectionsError } = await supabase
                .from('sections')
                .select(`
                    *,
                    questions (
                        *,
                        options (*)
                    )
                `)
                .eq('exam_id', attempt.exam_id)
                .order('section_order', { ascending: true });

            if (sectionsError) throw sectionsError;

            // Fetch all responses for this attempt
            const { data: responses, error: responsesError } = await supabase
                .from('responses')
                .select('*')
                .eq('attempt_id', attemptId);

            if (responsesError) throw responsesError;

            // Create a map of responses for quick lookup
            const responseMap = new Map(
                (responses || []).map(r => [r.question_id, r.student_answer])
            );

            let totalObtainedMarks = 0;
            const sectionResults: any[] = [];

            // Calculate marks for each section
            for (const section of sections) {
                let sectionObtainedMarks = 0;
                let correctAnswers = 0;
                let wrongAnswers = 0;
                let unanswered = 0;

                for (const question of section.questions) {
                    const studentAnswer = responseMap.get(question.id);

                    if (!studentAnswer) {
                        unanswered++;
                        continue;
                    }

                    let isCorrect = false;

                    if (question.question_type === 'MCQ') {
                        // Single correct option
                        const correctOption = question.options.find((opt: any) => opt.is_correct);
                        isCorrect = studentAnswer === correctOption?.id;
                    } else if (question.question_type === 'MSQ') {
                        // Multiple correct options
                        const correctOptionIds = question.options
                            .filter((opt: any) => opt.is_correct)
                            .map((opt: any) => opt.id)
                            .sort();

                        let studentOptionIds: string[] = [];
                        try {
                            studentOptionIds = JSON.parse(studentAnswer).sort();
                        } catch {
                            studentOptionIds = [studentAnswer];
                        }

                        isCorrect = JSON.stringify(correctOptionIds) === JSON.stringify(studentOptionIds);
                    } else if (question.question_type === 'NAT') {
                        // Numerical answer
                        isCorrect = studentAnswer.trim() === question.correct_answer?.trim();
                    }

                    if (isCorrect) {
                        sectionObtainedMarks += question.marks;
                        correctAnswers++;
                    } else {
                        sectionObtainedMarks -= question.negative_marks || 0;
                        wrongAnswers++;
                    }
                }

                totalObtainedMarks += sectionObtainedMarks;

                sectionResults.push({
                    section_id: section.id,
                    total_marks: section.total_marks,
                    obtained_marks: Math.max(0, sectionObtainedMarks),
                    correct_answers: correctAnswers,
                    wrong_answers: wrongAnswers,
                    unanswered: unanswered,
                });
            }

            // Ensure total marks don't go negative
            totalObtainedMarks = Math.max(0, totalObtainedMarks);

            // Calculate percentage
            const percentage = (totalObtainedMarks / examData.total_marks) * 100;

            // Insert result
            const { data: result, error: resultError } = await supabase
                .from('results')
                .insert({
                    attempt_id: attemptId,
                    total_marks: examData.total_marks,
                    obtained_marks: totalObtainedMarks,
                    percentage: percentage,
                })
                .select()
                .single();

            if (resultError) throw resultError;

            // Insert section results
            const sectionResultsWithResultId = sectionResults.map(sr => ({
                ...sr,
                result_id: result.id,
            }));

            const { error: sectionResultsError } = await supabase
                .from('section_results')
                .insert(sectionResultsWithResultId);

            if (sectionResultsError) throw sectionResultsError;

        } catch (error) {
            console.error('Error generating results:', error);
            // Don't throw - attempt is already submitted
        }

        return attempt;
    };

    const fetchExamResult = async (attemptId: string) => {
        const { data, error } = await supabase
            .from('results')
            .select(`
                *,
                section_results (*)
            `)
            .eq('attempt_id', attemptId)
            .single();

        if (error) return null;
        return data;
    };

    const fetchAttempts = async (studentId: string) => {
        if (!examId) return [];

        const { data, error } = await supabase
            .from('exam_attempts')
            .select(`
                *,
                results (*)
            `)
            .eq('exam_id', examId)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    };

    const { data: exam, isLoading: isLoadingExam } = useQuery({
        queryKey: ['exam', examId],
        queryFn: fetchExamDetails,
        enabled: !!examId,
    });

    const { data: sections, isLoading: isLoadingQuestions } = useQuery({
        queryKey: ['exam_questions', examId],
        queryFn: fetchExamQuestions,
        enabled: !!examId,
    });

    const startAttemptMutation = useMutation({
        mutationFn: startAttempt,
    });

    const saveResponseMutation = useMutation({
        mutationFn: saveResponse,
    });

    const submitAttemptMutation = useMutation({
        mutationFn: submitAttempt,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exam_attempts'] });
        },
    });

    return {
        exam,
        sections,
        isLoading: isLoadingExam || isLoadingQuestions,
        checkExamEligibility,
        startAttempt: startAttemptMutation.mutateAsync,
        saveResponse: saveResponseMutation.mutateAsync,
        submitAttempt: submitAttemptMutation.mutateAsync,
        isSubmitting: submitAttemptMutation.isPending,
        fetchExamResult,
        fetchAttempts,
    };
};
