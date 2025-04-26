
'use server';
/**
 * @fileOverview Job fit scoring AI agent using file data that also suggests roles and improvements.
 *
 * - jobFitScoring - A function that handles the job fit scoring process from a file, suggests roles, and provides improvement tips.
 * - JobFitScoringInput - The input type for the jobFitScoring function.
 * - JobFitScoringOutput - The return type for the jobFitScoring function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const JobFitScoringInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Supported types: PDF, DOC, DOCX."
    ),
  jobDescription: z.string().describe('The job description text to compare the resume against.'),
});
export type JobFitScoringInput = z.infer<typeof JobFitScoringInputSchema>;

const JobFitScoringOutputSchema = z.object({
  fitScore: z.number().min(0).max(1).describe('A score from 0 to 1 indicating how well the resume fits the job description.'),
  justification: z.string().describe('A brief justification for the assigned fit score.'),
  suggestedRoles: z.array(z.string()).describe('A list of 3-5 relevant job titles suggested based on the resume content.'),
  improvementSuggestions: z.array(z.string()).describe('A list of specific, actionable suggestions for improving the resume to better match the provided job description.'),
});
export type JobFitScoringOutput = z.infer<typeof JobFitScoringOutputSchema>;

export async function jobFitScoring(input: JobFitScoringInput): Promise<JobFitScoringOutput> {
  return jobFitScoringFlow(input);
}

const jobFitPrompt = ai.definePrompt({
  name: 'jobFitPrompt',
  input: {
    schema: z.object({
       resumeDataUri: z
        .string()
        .describe(
          "The resume file content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Supported types: PDF, DOC, DOCX."
        ),
      jobDescription: z.string().describe('The job description text to compare the resume against.'),
    }),
  },
  output: {
    schema: JobFitScoringOutputSchema, // Use the updated schema
  },
  prompt: `You are an expert career advisor and recruiter. Your tasks are to:
1.  Evaluate a resume (provided as a document) against a specific job description and provide a fit score (0-1) and justification.
2.  Suggest 3-5 alternative job titles based *only* on the skills and experience identified in the resume document.
3.  Provide specific, actionable suggestions on how the resume content can be improved to better match the *provided* job description.

Resume Document:
{{media url=resumeDataUri}}

Job Description Text:
{{{jobDescription}}}

Instructions:
- Analyze the content of the resume document.
- Calculate the fitScore between 0 and 1 based on skills, experience, and relevance to the job description text.
- Write a concise justification explaining the score.
- List 3-5 relevant job titles in the 'suggestedRoles' field based on the resume content.
- List specific, actionable resume improvement tips in the 'improvementSuggestions' field, focusing on alignment with the provided job description. Ensure suggestions are clear and helpful based on the resume's content.
  `,
});

const jobFitScoringFlow = ai.defineFlow<
  typeof JobFitScoringInputSchema,
  typeof JobFitScoringOutputSchema
>(
  {
    name: 'jobFitScoringFlow',
    inputSchema: JobFitScoringInputSchema,
    outputSchema: JobFitScoringOutputSchema, // Use the updated schema
    // Removed incorrect model configuration - relies on global default or prompt-level settings
  },
  async input => {
     try {
        const {output} = await jobFitPrompt(input);
        if (!output) {
            throw new Error('AI failed to generate job fit score. The document might be empty, corrupted, or in an unsupported format.');
        }
        // Basic validation/fallback for arrays if the model fails to provide them
        return {
            ...output,
            fitScore: output.fitScore ?? 0, // Default score if missing
            justification: output.justification ?? "Analysis could not be completed.", // Default justification
            suggestedRoles: output.suggestedRoles ?? [],
            improvementSuggestions: output.improvementSuggestions ?? [],
        };
     } catch (error) {
        console.error("Error in jobFitScoringFlow:", error);
         // Re-throw a more specific error or handle known issues like unsupported types
        if (error instanceof Error && error.message.includes('UNSUPPORTED_MEDIA_TYPE')) {
            throw new Error('Unsupported file type provided. Please use PDF, DOC, or DOCX.');
        }
        throw new Error('Failed to process resume file for job fit scoring.');
     }
  }
);

