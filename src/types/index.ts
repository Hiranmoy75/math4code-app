// Type definitions for the Math4Code mobile app

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'student' | 'admin';
    avatar_url?: string;
    referral_code?: string;
    referred_by?: string;
    created_at: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnail_url?: string;
    category?: string;
    level?: 'beginner' | 'intermediate' | 'advanced' | 'all';
    is_published: boolean;
    creator_id: string;
    instructor_name?: string;
    total_lessons?: number;
    is_enrolled?: boolean;
    progress_percentage?: number;
    completed_lessons?: number;
}

export interface Module {
    id: string;
    title: string;
    description?: string;
    module_order: number;
    course_id: string;
    lessons?: Lesson[];
}

export interface Lesson {
    id: string;
    title: string;
    content_type: 'video' | 'pdf' | 'text' | 'quiz' | 'exam';
    description?: string;
    video_url?: string;
    pdf_url?: string;
    text_content?: string;
    content_url?: string;
    content_text?: string;
    video_duration?: number; // in minutes
    lesson_order: number;
    module_id: string;
    is_free_preview?: boolean;
    is_completed?: boolean;
    thumbnail_url?: string;
    is_downloadable?: boolean;
    exam_id?: string;
    // Live class fields
    is_live?: boolean;
    meeting_url?: string;
    meeting_date?: string;
    meeting_platform?: 'google_meet' | 'zoom' | 'teams' | 'other';
    // Bunny.net video fields
    bunny_video_id?: string;
    bunny_library_id?: string;
    bunny_stream_id?: string;
    video_provider?: 'youtube' | 'bunny' | 'direct';
    video_type?: 'vod' | 'live';
    video_status?: string;
}

export interface Exam {
    id: string;
    title: string;
    description?: string;
    duration_minutes: number;
    total_marks: number;
    negative_marking: number;
    status: 'draft' | 'published' | 'archived';
    start_time?: string;
    end_time?: string;
    max_attempts?: number;
    result_visibility?: 'immediate' | 'manual' | 'scheduled';
    result_release_time?: string;
    show_answers?: boolean;
    show_results_immediately?: boolean;
}

export interface Section {
    id: string;
    exam_id: string;
    title: string;
    duration_minutes: number;
    total_marks: number;
    section_order: number;
    max_questions_to_attempt?: number | null;
    required_attempts?: number | null;
    questions?: Question[];
}

export interface Question {
    id: string;
    section_id: string;
    question_text: string;
    question_type: 'MCQ' | 'MSQ' | 'NAT';
    marks: number;
    negative_marks: number;
    correct_answer?: string;
    explanation?: string;
    options?: Option[];
}

export interface Option {
    id: string;
    question_id: string;
    option_text: string;
    option_order: number;
    is_correct?: boolean;
}

export interface ExamAttempt {
    id: string;
    exam_id: string;
    student_id: string;
    started_at: string;
    submitted_at?: string;
    status: 'in_progress' | 'submitted' | 'graded';
    total_time_spent: number;
}

export interface Response {
    id: string;
    attempt_id: string;
    question_id: string;
    student_answer?: string;
    is_marked_for_review: boolean;
}

export interface Result {
    id: string;
    attempt_id: string;
    total_marks: number;
    obtained_marks: number;
    percentage: number;
    rank?: number;
}



export interface RewardStatus {
    user_id: string;
    total_coins: number;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
    daily_coins_earned: number;
    last_coin_date: string;
    xp: number;
    level: number;
    weekly_xp: number;
}

export interface Mission {
    id: string;
    title: string;
    reward: number;
    progress: number;
    goal: number;
    completed: boolean;
    icon: string;
}

export interface Badge {
    badge_id: string;
    earned_at: string;
}

export interface LeaderboardEntry {
    user_id: string;
    total_coins: number;
    xp: number;
    weekly_xp: number;
    level: number;
    current_streak: number;
    profiles: {
        full_name: string;
        avatar_url?: string;
    };
}

// Community types
export type ChannelType = 'announcement' | 'discussion' | 'qa';

export interface CommunityChannel {
    id: string;
    course_id: string;
    name: string;
    type: ChannelType;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CommunityMessage {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    attachments: any[];
    is_pinned: boolean;
    is_announcement: boolean;
    parent_message_id: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    profiles?: {
        full_name: string | null;
        avatar_url: string | null;
        role: string;
    };
    community_reactions?: CommunityReaction[];
    community_bookmarks?: { id: string; user_id: string }[];
}

export interface CommunityReaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}

export interface CommunityBookmark {
    id: string;
    message_id: string;
    user_id: string;
    created_at: string;
}

export interface EnrolledCourseWithChannels extends Course {
    channels: CommunityChannel[];
}

export interface StudentStats {
    totalExams: number;
    averageScore: number;
    rank: number;
}

// Navigation types
export type RootStackParamList = {
    Splash: undefined;
    Auth: undefined;
    Main: undefined;
    CourseDetails: { courseId: string };
    LessonPlayer: { courseId: string; lessonId: string };
    ExamScreen: { examId: string; attemptId?: string };
    ResultScreen: { attemptId: string; examId: string };
    QuestionAnalysisScreen: { attemptId: string; examId: string };
    PaymentStatus: { transactionId: string; courseId: string };
    PaymentWebView: { paymentUrl: string; transactionId: string; courseId: string };
    AIChat: undefined;
    AllCourses: undefined;
    Mentions: undefined;
    Bookmarks: undefined;
    LegalPage: { type: 'privacy' | 'terms' | 'refund' };
    RewardScreen: undefined;
    ResetPassword: undefined;
};

export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    ForgotPassword: undefined;
    ResetPassword: undefined;
};

export type StudentTabParamList = {
    HomeTab: undefined;
    LibraryTab: undefined;
    CommunityTab: undefined;
    ProfileTab: undefined;
};

export type HomeStackParamList = {
    Dashboard: undefined;
    CourseDetails: { courseId: string };
    LessonPlayer: { courseId: string; lessonId: string };
};

export type CoursesStackParamList = {
    CoursesList: undefined;
    CourseDetails: { courseId: string };
};



export type RewardsStackParamList = {
    RewardsHub: undefined;
    Leaderboard: undefined;
};

export type ProfileStackParamList = {
    Profile: undefined;
    Settings: undefined;
    EditProfile: undefined;
};
