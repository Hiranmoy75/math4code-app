import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Exam, Section, Question, ExamAttempt, Option } from '../types';

// ✅ PERF: Cache tenant_id per attemptId to avoid extra DB call on each answer save
const tenantIdCache = new Map<string, string>();

export const useExam = (examId?: string) => {
    const queryClient = useQueryClient();

    // -------------------------------------------------------------
    // 1. ROBUST SESSION FETCH (Parallel)
    // -------------------------------------------------------------
    const fetchExamSession = async (studentId: string) => {
        if (!examId) throw new Error("No Exam ID");

        // We fetch everything in parallel for speed
        const [
            examResult,
            sectionsResult,
            attemptsResult
        ] = await Promise.all([
            // 1. Exam Details
            supabase.from('exams').select('*').eq('id', examId).single(),
            // 2. Sections & Questions
            supabase.from('sections')
                .select('*, questions(*, options(*))')
                .eq('exam_id', examId)
                .order('section_order')
                .order('question_order', { referencedTable: 'questions' }),
            // 3. Existing Attempts for this user
            supabase.from('exam_attempts')
                .select('*')
                .eq('exam_id', examId)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
        ]);

        if (examResult.error) throw examResult.error;
        if (sectionsResult.error) throw sectionsResult.error;

        const exam = examResult.data as Exam;
        let sections = (sectionsResult.data || []) as Section[];
        const attempts = (attemptsResult.data || []) as ExamAttempt[];

        // --- Fallback Options Fetching if nested options relation is missing/empty ---
        const allQuestions = sections.flatMap((s: any) => s.questions || []);
        const questionsMissingOptions = allQuestions.filter((q: any) => {
            const qType = (q.question_type || '').toUpperCase().trim();
            return (qType === 'MCQ' || qType === 'MSQ') && (!q.options || q.options.length === 0);
        });

        if (questionsMissingOptions.length > 0) {
            const qIds = questionsMissingOptions.map((q: any) => q.id);
            const { data: fallbackOptions } = await supabase
                .from('options')
                .select('*')
                .in('question_id', qIds)
                .order('option_order', { ascending: true });

            if (fallbackOptions && fallbackOptions.length > 0) {
                const optMap = new Map<string, any[]>();
                fallbackOptions.forEach((opt: any) => {
                    if (!optMap.has(opt.question_id)) optMap.set(opt.question_id, []);
                    optMap.get(opt.question_id)!.push(opt);
                });

                sections = sections.map((s: any) => ({
                    ...s,
                    questions: (s.questions || []).map((q: any) => ({
                        ...q,
                        options: (q.options && q.options.length > 0)
                            ? q.options
                            : (optMap.get(q.id) || [])
                    }))
                }));
            }
        }

        // --- Shuffle & Sort Logic ---
        sections = sections.map((section: any) => {
            // Sort options first (always sort options safely)
            let questions = (section.questions || []).map((q: any) => ({
                ...q,
                options: (q.options || []).sort((a: any, b: any) => (a.option_order || 0) - (b.option_order || 0))
            }));

            questions.sort((a: any, b: any) => (a.question_order || 0) - (b.question_order || 0));

            return { ...section, questions };
        });

        // --- Attempt Identification ---
        // Find existing in-progress or latest submitted
        const inProgress = attempts.find(a => a.status === 'in_progress');

        let activeAttempt = inProgress || null;
        let previousResponses = {};

        // If we found an attempt (even submitted, if we need it for review later), fetch responses
        if (activeAttempt) {
            const { data: responses } = await supabase
                .from('responses')
                .select('question_id, student_answer, is_marked_for_review')
                .eq('attempt_id', activeAttempt.id);

            if (responses) {
                const map: any = {};
                responses.forEach(r => {
                    // Try parsing JSON if valid, else string
                    try {
                        map[r.question_id] = JSON.parse(r.student_answer || '');
                    } catch {
                        map[r.question_id] = r.student_answer;
                    }
                });
                previousResponses = map;
            }
        }

        return {
            exam,
            sections,
            activeAttempt,
            previousResponses,
            attemptsCount: attempts.length
        };
    };

    // -------------------------------------------------------------
    // 2. CHECK ELIGIBILITY
    // -------------------------------------------------------------
    const checkExamEligibility = async (studentId: string) => {
        // Re-using logic mostly, but refined
        if (!examId) return { eligible: false, message: "Invalid Exam ID" };

        const { data: exam, error } = await supabase.from('exams').select('max_attempts, start_time, end_time').eq('id', examId).single();
        if (error || !exam) return { eligible: false, message: "Exam not found" };

        const now = new Date();
        if (exam.start_time && now < new Date(exam.start_time)) return { eligible: false, reason: 'upcoming', message: `Available from ${new Date(exam.start_time).toLocaleString()}` };
        if (exam.end_time && now > new Date(exam.end_time)) return { eligible: false, reason: 'expired', message: "Exam Expired" };

        // Check Max Attempts
        if (exam.max_attempts) {
            const { count } = await supabase
                .from('exam_attempts')
                .select('*', { count: 'exact', head: true })
                .eq('exam_id', examId)
                .eq('student_id', studentId)
                .eq('status', 'submitted');

            if ((count || 0) >= exam.max_attempts) {
                return { eligible: false, message: "Max attempts reached" };
            }
        }

        return { eligible: true };
    };

    // -------------------------------------------------------------
    // 3. START ATTEMPT (Updated for Pause logic & RLS tenant_id safety)
    // -------------------------------------------------------------
    const startAttempt = async (params: { studentId: string; customTenantId?: string } | string) => {
        const studentId = typeof params === 'string' ? params : params?.studentId;
        const customTenantId = typeof params === 'object' ? params?.customTenantId : undefined;

        if (!studentId) throw new Error("Student ID is required");

        // Get Tenant ID First (with fallback to user active membership)
        let tenantId = customTenantId;
        if (!tenantId) {
            const { data: examData } = await supabase.from('exams').select('tenant_id').eq('id', examId).single();
            tenantId = examData?.tenant_id;
        }

        if (!tenantId) {
            const { data: membership } = await supabase
                .from('user_tenant_memberships')
                .select('tenant_id')
                .eq('user_id', studentId)
                .eq('is_active', true)
                .maybeSingle();
            tenantId = membership?.tenant_id;
        }

        // Check existing first (concurrency safety)
        const { data: existing } = await supabase.from('exam_attempts')
            .select('*')
            .eq('exam_id', examId)
            .eq('student_id', studentId)
            .eq('status', 'in_progress')
            .maybeSingle();

        if (existing) {
            // RESUME LOGIC: If paused, update last_activity or is_paused=false
            if (existing.is_paused) {
                await supabase.from('exam_attempts').update({
                    is_paused: false,
                    last_activity_at: new Date().toISOString()
                }).eq('id', existing.id);
                return { ...existing, is_paused: false };
            }
            return existing;
        }

        const insertPayload: any = {
            exam_id: examId,
            student_id: studentId,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            total_time_spent: 0,
            elapsed_time_seconds: 0,
            last_activity_at: new Date().toISOString(),
            is_paused: false
        };

        if (tenantId) {
            insertPayload.tenant_id = tenantId;
        }

        const { data, error } = await supabase.from('exam_attempts').insert(insertPayload).select().single();

        if (error) {
            console.error('[START_ATTEMPT_ERROR]', error);
            throw error;
        }
        return data as ExamAttempt;
    };

    // -------------------------------------------------------------
    // 4. SYNC TIMER / PAUSE
    // -------------------------------------------------------------
    const updateTimer = async ({ attemptId, elapsedSeconds, isPaused }: { attemptId: string, elapsedSeconds: number, isPaused?: boolean }) => {
        const update: any = {
            elapsed_time_seconds: Math.floor(elapsedSeconds),
            total_time_spent: Math.floor(elapsedSeconds),
            last_activity_at: new Date().toISOString()
        };
        if (isPaused !== undefined) update.is_paused = isPaused;

        const { data, error } = await supabase
            .from('exam_attempts')
            .update(update)
            .eq('id', attemptId)
            .select();

        if (error) {
            console.error('[UPDATE_TIMER] Error:', error);
            throw error;
        }

        return data;
    };

    // -------------------------------------------------------------
    // 5. SAVE RESPONSE & SUBMIT
    // -------------------------------------------------------------
    const saveResponse = async ({ attemptId, questionId, answer, isMarkedForReview }: any) => {
        // ✅ CRITICAL: Match website's format exactly:
        //   - MCQ:  store as plain UUID string  e.g. "abc-123" (NOT JSON-encoded "\"abc-123\"")
        //   - MSQ:  store as JSON array          e.g. ["uuid1","uuid2"]
        //   - NAT:  store as plain string        e.g. "42"
        // The SQL grading function checks: o.id::text = r.student_answer (for MCQ)
        // JSON.stringify wraps the UUID in extra quotes which would NEVER match.
        const studentAnswer = Array.isArray(answer) ? JSON.stringify(answer) : String(answer ?? '');

        // ✅ PERF: Use cached tenant_id — avoid extra SELECT per answer save
        let tenantId = tenantIdCache.get(attemptId);
        if (!tenantId) {
            const { data: attemptData } = await supabase
                .from('exam_attempts')
                .select('tenant_id')
                .eq('id', attemptId)
                .single();
            tenantId = attemptData?.tenant_id;
            if (tenantId) tenantIdCache.set(attemptId, tenantId);
        }

        await supabase.from('responses').upsert({
            tenant_id: tenantId,
            attempt_id: attemptId,
            question_id: questionId,
            student_answer: studentAnswer,
            is_marked_for_review: isMarkedForReview || false,
            updated_at: new Date().toISOString()
        }, { onConflict: 'attempt_id, question_id' });
    };

    const submitAttempt = async ({ attemptId }: { attemptId: string }) => {
        const { data: attempt } = await supabase.from('exam_attempts').select('exam_id').eq('id', attemptId).single();
        if (!attempt) throw new Error("Attempt not found");

        const { data, error } = await supabase.rpc('submit_exam_attempt', {
            p_attempt_id: attemptId,
            p_exam_id: attempt.exam_id
        });

        if (error) throw error;
        // Check JSON error result from RPC
        if (data && (data as any).error) throw new Error((data as any).error);
        return data;
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

    const { data: exam } = useQuery({
        queryKey: ['exam_details', examId],
        queryFn: async () => {
            if (!examId) return null;
            const { data } = await supabase.from('exams').select('*').eq('id', examId).single();
            return data as Exam;
        },
        enabled: !!examId
    });

    const { data: sections } = useQuery({
        queryKey: ['exam_sections', examId],
        queryFn: async () => {
            if (!examId) return [];
            const { data } = await supabase
                .from('sections')
                .select('*, questions(id)')
                .eq('exam_id', examId);
            return data as Section[];
        },
        enabled: !!examId
    });

    const fetchAttempts = async (studentId: string) => {
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

    return {
        // New Query Hook
        fetchSession: (studentId: string) => useQuery({
            queryKey: ['exam_session', examId, studentId],
            queryFn: () => fetchExamSession(studentId),
            enabled: !!examId && !!studentId
        }),

        // Actions
        checkExamEligibility,
        startAttempt: useMutation({ mutationFn: startAttempt }).mutateAsync,
        updateTimer: useMutation({ mutationFn: updateTimer }).mutateAsync,
        saveResponse: useMutation({ mutationFn: saveResponse }).mutateAsync,
        submitAttempt: useMutation({ mutationFn: submitAttempt }).mutateAsync,

        // Legacy/Helpers
        fetchExamResult,
        fetchAttempts,
        exam,
        sections
    };
};
