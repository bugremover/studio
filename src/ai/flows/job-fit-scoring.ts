'use server';
/**
 * @fileOverview Job fit scoring AI agent that also suggests roles and improvements.
 *
 * - jobFitScoring - A function that handles the job fit scoring process, suggests roles, and provides improvement tips.
 * - JobFitScoringInput - The input type for the jobFitScoring function.
 * - JobFitScoringOutput - The return type for the jobFitScoring function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const JobFitScoringInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
  jobDescription: z.string().describe('The job description to compare the resume against.'),
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
      resumeText: z.string().describe('The text content of the resume.'),
      jobDescription: z.string().describe('The job description to compare the resume against.'),
    }),
  },
  output: {
    schema: JobFitScoringOutputSchema, // Use the updated schema
  },
  prompt: `You are an expert career advisor and recruiter. Your tasks are to:
1.  Evaluate a resume against a specific job description and provide a fit score (0-1) and justification.
2.  Suggest 3-5 alternative job titles based *only* on the skills and experience listed in the resume.
3.  Provide specific, actionable suggestions on how the resume can be improved to better match the *provided* job description.

Resume Text:
{{{resumeText}}}

Job Description:
{{{jobDescription}}}

Instructions:
- Calculate the fitScore between 0 and 1 based on skills, experience, and relevance to the job description.
- Write a concise justification explaining the score.
- List 3-5 relevant job titles in the 'suggestedRoles' field based on the resume content.
- List specific, actionable resume improvement tips in the 'improvementSuggestions' field, focusing on alignment with the provided job description. Ensure suggestions are clear and helpful.
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
  },
  async input => {
    const {output} = await jobFitPrompt(input);
    // Basic validation/fallback for arrays if the model fails to provide them
    return {
        ...output!,
        suggestedRoles: output?.suggestedRoles ?? [],
        improvementSuggestions: output?.improvementSuggestions ?? [],
    };
  }
);
