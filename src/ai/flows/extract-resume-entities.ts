'use server';
/**
 * @fileOverview Resume entity extraction AI agent.
 *
 * - extractResumeEntities - A function that handles the resume entity extraction process.
 * - ExtractResumeEntitiesInput - The input type for the extractResumeEntities function.
 * - ExtractResumeEntitiesOutput - The return type for the extractResumeEntities function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExtractResumeEntitiesInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
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
      resumeText: z.string().describe('The text content of the resume.'),
    }),
  },
  output: {
    schema: z.object({
      skills: z.array(z.string()).describe('A list of skills extracted from the resume.'),
      experience: z.array(z.string()).describe('A list of work experiences extracted from the resume.'),
      education: z.array(z.string()).describe('A list of educational experiences extracted from the resume.'),
    }),
  },
  prompt: `You are an AI assistant specialized in extracting information from resumes.

  Given the following resume text, extract the key skills, work experiences, and educational experiences.
  Return the information in a structured JSON format.

  Resume Text: {{{resumeText}}}

  skills:
  experience:
  education:`,
});

const extractResumeEntitiesFlow = ai.defineFlow<
  typeof ExtractResumeEntitiesInputSchema,
  typeof ExtractResumeEntitiesOutputSchema
>({
  name: 'extractResumeEntitiesFlow',
  inputSchema: ExtractResumeEntitiesInputSchema,
  outputSchema: ExtractResumeEntitiesOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
