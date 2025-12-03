import { AI_SYSTEM_PROMPT } from '../constants/aiContext';

// api.ts

// 1. **API Key Setup**
// Gets the API key from environment variables.
const GEMINI_API_KEY = process.env.EXPO_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// 2. **Corrected Model and URL**
// Use the official, current model name 'gemini-2.5-flash'.
// Use the standard API URL format.
const MODEL_NAME = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Sends a message to the Gemini API and retrieves a text response.
 * @param message The user's input prompt.
 * @returns The AI's text response.
 */
export const generateResponse = async (message: string): Promise<string> => {
    try {
        if (!GEMINI_API_KEY) {
            // Throw an error if the key is missing
            throw new Error('Gemini API Key is missing. Please set EXPO_GEMINI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY in your environment.');
        }

        // 3. **API Call**
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                // Ensure the content type is set correctly
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: {
                        text: AI_SYSTEM_PROMPT,
                    },
                },
                // The contents array holds the conversation history or a single prompt
                contents: [
                    {
                        parts: [
                            {
                                text: message,
                            },
                        ],
                    },
                ],
            }),
        });

        // 4. **Error Handling (HTTP Status)**
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Response Error:', errorData);
            throw new Error(errorData.error?.message || `Failed to fetch response from Gemini (Status: ${response.status})`);
        }

        // 5. **Response Parsing**
        const data = await response.json();

        // Safely extract the generated text from the deeply nested structure
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // 6. **Error Handling (No Content)**
        if (!aiResponse) {
            throw new Error('No response generated. The model may have been blocked due to safety settings.');
        }

        // 7. **Return Value**
        return aiResponse;
    } catch (error) {
        console.error('Gemini API Error in generateResponse:', error);
        // Re-throw the error for the calling application to handle
        throw error;
    }
};