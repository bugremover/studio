'use server';
/**
 * @fileOverview Job fit scoring AI agent.
 *
 * - jobFitScoring - A function that handles the job fit scoring process.
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
  fitScore: z.number().describe('A score from 0 to 1 indicating how well the resume fits the job description.'),
  justification: z.string().describe('A brief justification for the assigned fit score.'),
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
    schema: z.object({
      fitScore: z.number().describe('A score from 0 to 1 indicating how well the resume fits the job description.'),
      justification: z.string().describe('A brief justification for the assigned fit score.'),
    }),
  },
  prompt: `You are an expert recruiter tasked with evaluating resumes based on a job description.

  Given the following resume text and job description, determine a fit score (0-1) and a brief justification for the score.

  Resume Text: {{{resumeText}}}
  Job Description: {{{jobDescription}}}

  Consider skills, experience, and overall relevance when determining the score.
  Ensure that the fitScore is a number between 0 and 1 (inclusive).
  The justification should be concise and explain the main reasons for the assigned score.
  `,
});

const jobFitScoringFlow = ai.defineFlow<
  typeof JobFitScoringInputSchema,
  typeof JobFitScoringOutputSchema
>(
  {
    name: 'jobFitScoringFlow',
    inputSchema: JobFitScoringInputSchema,
    outputSchema: JobFitScoringOutputSchema,
  },
  async input => {
    const {output} = await jobFitPrompt(input);
    return output!;
  }
);
