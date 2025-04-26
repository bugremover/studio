'use server';

import { z } from 'zod';
import { extractResumeEntities, type ExtractResumeEntitiesInput, type ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import { jobFitScoring, type JobFitScoringInput, type JobFitScoringOutput } from '@/ai/flows/job-fit-scoring';
import { generateResume, type GenerateResumeInput, type GenerateResumeOutput } from '@/ai/flows/generate-resume'; // Import new flow

// Schema for analysis action
const analysisActionInputSchema = z.object({
  resumeText: z.string(),
  jobDescription: z.string(),
});
type AnalysisActionInput = z.infer<typeof analysisActionInputSchema>;

// ActionResult for analysis
type AnalysisActionResult = {
    entities: ExtractResumeEntitiesOutput;
    scoring: JobFitScoringOutput;
};

// Analysis Action Function
export async function analyzeResumeAction(input: AnalysisActionInput): Promise<AnalysisActionResult> {
  const validatedInput = analysisActionInputSchema.parse(input);

  try {
    const [entitiesResult, scoringResult] = await Promise.all([
      extractResumeEntities({ resumeText: validatedInput.resumeText }),
      jobFitScoring({
        resumeText: validatedInput.resumeText,
        jobDescription: validatedInput.jobDescription,
      }),
    ]);

    const finalScoringResult: JobFitScoringOutput = {
        ...scoringResult,
        suggestedRoles: scoringResult.suggestedRoles ?? [],
        improvementSuggestions: scoringResult.improvementSuggestions ?? [],
    };

    return {
      entities: entitiesResult,
      scoring: finalScoringResult,
    };
  } catch (error) {
    console.error('Error in analyzeResumeAction:', error);
    throw new Error('Failed to analyze resume.');
  }
}


// Schema for generation action (matches GenerateResumeInput)
const generationActionInputSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  contactInfo: z.string().min(1, 'Contact information is required.'),
  skills: z.string().min(1, 'Skills are required.'),
  experience: z.string().min(1, 'Experience is required.'),
  education: z.string().min(1, 'Education is required.'),
  targetJobDescription: z.string().optional(),
  tone: z.enum(['professional', 'creative', 'technical']).default('professional'),
});
type GenerationActionInput = z.infer<typeof generationActionInputSchema>;

// ActionResult for generation
type GenerationActionResult = GenerateResumeOutput;

// Generation Action Function
export async function generateResumeAction(input: GenerationActionInput): Promise<GenerationActionResult> {
    const validatedInput = generationActionInputSchema.parse(input);

    try {
        const result = await generateResume(validatedInput);
        return result;
    } catch (error) {
        console.error('Error in generateResumeAction:', error);
        throw new Error('Failed to generate resume.');
    }
}
