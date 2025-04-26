
'use server';
/**
 * @fileOverview Resume entity extraction AI agent using file data.
 *
 * - extractResumeEntities - A function that handles the resume entity extraction process from a file.
 * - ExtractResumeEntitiesInput - The input type for the extractResumeEntities function.
 * - ExtractResumeEntitiesOutput - The return type for the extractResumeEntities function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExtractResumeEntitiesInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Supported types: PDF, DOC, DOCX."
    ),
});
export type ExtractResumeEntitiesInput = z.infer<typeof ExtractResumeEntitiesInputSchema>;

const ExtractResumeEntitiesOutputSchema = z.object({
  skills: z.array(z.string()).describe('A list of skills extracted from the resume.'),
  experience: z.array(z.string()).describe('A list of work experiences extracted from the resume.'),
  education: z.array(z.string()).describe('A list of educational experiences extracted from the resume.'),
});
export type ExtractResumeEntitiesOutput = z.infer<typeof ExtractResumeEntitiesOutputSchema>;

export async function extractResumeEntities(input: ExtractResumeEntitiesInput): Promise<ExtractResumeEntitiesOutput> {
  return extractResumeEntitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractResumeEntitiesPrompt',
  input: {
    schema: z.object({
       resumeDataUri: z
        .string()
        .describe(
          "The resume file content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Supported types: PDF, DOC, DOCX."
        ),
    }),
  },
  output: {
    schema: ExtractResumeEntitiesOutputSchema,
  },
  prompt: `You are an AI assistant specialized in extracting information from resumes provided as documents.

  Given the following resume document, extract the key skills, work experiences, and educational experiences.
  Return the information in the specified structured JSON format.

  Resume Document: {{media url=resumeDataUri}}

  Extract the following:
  - skills: (Array of strings)
  - experience: (Array of strings, each describing a role/company)
  - education: (Array of strings, each describing a degree/institution)`,
});

const extractResumeEntitiesFlow = ai.defineFlow<
  typeof ExtractResumeEntitiesInputSchema,
  typeof ExtractResumeEntitiesOutputSchema
>({
  name: 'extractResumeEntitiesFlow',
  inputSchema: ExtractResumeEntitiesInputSchema,
  outputSchema: ExtractResumeEntitiesOutputSchema,
  // Removed incorrect model configuration - relies on global default or prompt-level settings
}, async input => {
  try {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('AI failed to extract entities. The document might be empty, corrupted, or in an unsupported format.');
    }
     // Basic validation/fallback for arrays if the model fails to provide them
    return {
      skills: output.skills ?? [],
      experience: output.experience ?? [],
      education: output.education ?? [],
    };
  } catch (error) {
    console.error("Error in extractResumeEntitiesFlow:", error);
    // Re-throw a more specific error or handle known issues like unsupported types
    if (error instanceof Error && error.message.includes('UNSUPPORTED_MEDIA_TYPE')) {
         throw new Error('Unsupported file type provided. Please use PDF, DOC, or DOCX.');
    }
    throw new Error('Failed to process resume file for entity extraction.');
  }
});

