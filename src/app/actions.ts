'use server';

import { z } from 'zod';
import { extractResumeEntities, type ExtractResumeEntitiesInput, type ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import { jobFitScoring, type JobFitScoringInput, type JobFitScoringOutput } from '@/ai/flows/job-fit-scoring';

const actionInputSchema = z.object({
  resumeText: z.string(),
  jobDescription: z.string(),
});

type ActionInput = z.infer<typeof actionInputSchema>;

// ActionResult now directly includes the full JobFitScoringOutput type
type ActionResult = {
    entities: ExtractResumeEntitiesOutput;
    scoring: JobFitScoringOutput; // This now includes fitScore, justification, suggestedRoles, and improvementSuggestions
};

export async function analyzeResumeAction(input: ActionInput): Promise<ActionResult> {
  const validatedInput = actionInputSchema.parse(input);

  try {
    // Run both AI flows concurrently
    const [entitiesResult, scoringResult] = await Promise.all([
      extractResumeEntities({ resumeText: validatedInput.resumeText }),
      jobFitScoring({
        resumeText: validatedInput.resumeText,
        jobDescription: validatedInput.jobDescription,
      }),
    ]);

    // Ensure arrays are present, even if empty, to prevent frontend errors
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
    // Re-throw the error to be caught by the calling component
    throw new Error('Failed to analyze resume.');
  }
}
