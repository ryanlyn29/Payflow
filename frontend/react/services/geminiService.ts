import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

if (import.meta.env.DEV) {
  console.log('Gemini API Key loaded:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT FOUND');
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export const geminiService = {
  generateResponse: async (prompt: string, history: GeminiMessage[] = []): Promise<string> => {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    try {

      const messages = history.length === 0 
        ? [
            {
              role: 'user' as const,
              parts: [{ text: prompt }]
            }
          ]
        : [
            ...history,
            {
              role: 'user' as const,
              parts: [{ text: prompt }]
            }
          ];

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: msg.parts
          })),
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || "I'm not sure how to respond to that.";
    } catch (error: any) {
      console.error('Gemini API error:', error);
      if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('API key')) {
        throw new Error('Gemini API key is invalid or not configured. Please check your VITE_GEMINI_API_KEY in .env.local');
      }
      if (error.response?.status === 403) {
        throw new Error('Gemini API key is invalid or has insufficient permissions');
      }
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to generate response');
    }
  }
};

