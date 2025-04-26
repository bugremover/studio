'use server';
/**
 * @fileOverview Resume generation AI agent.
 *
 * - generateResume - A function that handles the resume generation process.
 * - GenerateResumeInput - The input type for the generateResume function.
 * - GenerateResumeOutput - The return type for the generateResume function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateResumeInputSchema = z.object({
  fullName: z.string().describe('The full name of the applicant.'),
  contactInfo: z.string().describe('Contact information (e.g., phone, email, LinkedIn).'),
  skills: z.string().describe('A comma-separated list or description of skills.'),
  experience: z.string().describe('Description of work experience (e.g., job titles, companies, dates, responsibilities).'),
  education: z.string().describe('Description of educational background (e.g., degrees, institutions, dates).'),
  targetJobDescription: z.string().optional().describe('An optional job description to tailor the resume towards.'),
  tone: z.enum(['professional', 'creative', 'technical']).default('professional').describe('The desired tone of the resume (professional, creative, technical).'),
});
export type GenerateResumeInput = z.infer<typeof GenerateResumeInputSchema>;

const GenerateResumeOutputSchema = z.object({
  resumeText: z.string().describe('The generated resume content in Markdown format.'),
});
export type GenerateResumeOutput = z.infer<typeof GenerateResumeOutputSchema>;

export async function generateResume(input: GenerateResumeInput): Promise<GenerateResumeOutput> {
  return generateResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateResumePrompt',
  input: {
    schema: GenerateResumeInputSchema,
  },
  output: {
    schema: GenerateResumeOutputSchema,
  },
  prompt: `You are an expert resume writer. Generate a professional resume in Markdown format based on the following details. Structure it logically with standard sections (Contact Info, Summary/Objective, Skills, Experience, Education).

Full Name: {{{fullName}}}
Contact Info: {{{contactInfo}}}
Skills: {{{skills}}}
Experience: {{{experience}}}
Education: {{{education}}}
Tone: {{{tone}}}

{{#if targetJobDescription}}
Tailor the resume to strongly align with this job description:
{{{targetJobDescription}}}
Focus on highlighting relevant skills and experiences mentioned in the job description. Use keywords from the job description where appropriate. Start with a summary or objective specifically targeting this role.
{{else}}
Create a general-purpose resume suitable for various professional roles. Start with a concise professional summary.
{{/if}}

Ensure the output is well-formatted Markdown. Use bullet points for lists within Experience and Skills sections.
`,
});

const generateResumeFlow = ai.defineFlow<
  typeof GenerateResumeInputSchema,
  typeof GenerateResumeOutputSchema
>(
  {
    name: 'generateResumeFlow',
    inputSchema: GenerateResumeInputSchema,
    outputSchema: GenerateResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
