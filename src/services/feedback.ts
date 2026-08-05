import { supabase } from './supabase';

export interface FeedbackData {
    message: string;
    category?: 'general' | 'bug' | 'feature' | 'support';
}

export const feedbackService = {
    /**
     * Submit user feedback to the database
     */
    async submitFeedback(data: FeedbackData): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { success: false, error: 'User not authenticated' };
            }

            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: user.id,
                    message: data.message,
                    category: data.category || 'general',
                    status: 'pending',
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Feedback submission error:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Feedback service error:', error);
            return { success: false, error: error.message || 'Failed to submit feedback' };
        }
    }
};
