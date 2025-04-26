
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Default model set to Gemini flash. Prompts/flows can override this if needed.
  model: 'googleai/gemini-2.0-flash',
});
