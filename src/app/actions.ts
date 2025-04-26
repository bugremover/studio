
'use server';

import { z } from 'zod';
import { extractResumeEntities, type ExtractResumeEntitiesInput, type ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import { jobFitScoring, type JobFitScoringInput, type JobFitScoringOutput } from '@/ai/flows/job-fit-scoring';
import { generateResume, type GenerateResumeInput, type GenerateResumeOutput } from '@/ai/flows/generate-resume';
import { saveAnalysis, saveGeneratedResume } from '@/services/firestore'; // Import Firestore service

// --- Analysis Action ---
const analysisActionInputSchema = z.object({
  resumeDataUri: z.string().min(1, 'Resume file data is required.').startsWith('data:', { message: 'Invalid file data format.' }),
  jobDescription: z.string().min(1, 'Job description cannot be empty.'),
});
type AnalysisActionInput = z.infer<typeof analysisActionInputSchema>;

type AnalysisActionResult = {
    entities: ExtractResumeEntitiesOutput;
    scoring: JobFitScoringOutput;
    analysisId: string | null; // Add ID for reference if needed
};

export async function analyzeResumeAction(input: AnalysisActionInput): Promise<AnalysisActionResult> {
  const validatedInput = analysisActionInputSchema.parse(input);

  try {
    // Call AI flows with the data URI
    const [entitiesResult, scoringResult] = await Promise.all([
      extractResumeEntities({ resumeDataUri: validatedInput.resumeDataUri }),
      jobFitScoring({
        resumeDataUri: validatedInput.resumeDataUri,
        jobDescription: validatedInput.jobDescription,
      }),
    ]);

    const finalScoringResult: JobFitScoringOutput = {
        ...scoringResult,
        fitScore: scoringResult.fitScore ?? 0, // Ensure defaults are set
        justification: scoringResult.justification ?? "Analysis could not be completed.",
        suggestedRoles: scoringResult.suggestedRoles ?? [],
        improvementSuggestions: scoringResult.improvementSuggestions ?? [],
    };

     const finalEntitiesResult: ExtractResumeEntitiesOutput = {
        skills: entitiesResult.skills ?? [],
        experience: entitiesResult.experience ?? [],
        education: entitiesResult.education ?? [],
     };


    // Save to Firestore
    const analysisId = await saveAnalysis({
      // Omit resumeDataUri from Firestore for brevity/security if needed
      jobDescription: validatedInput.jobDescription, // Store job description
      entities: finalEntitiesResult,
      scoring: finalScoringResult,
      createdAt: new Date() as any, // Placeholder, serverTimestamp added in service
    });

    if (!analysisId) {
        console.warn('Failed to save analysis to Firestore.');
        // Optionally throw an error or return a specific status if saving is critical
    }

    return {
      entities: finalEntitiesResult,
      scoring: finalScoringResult,
      analysisId: analysisId,
    };
  } catch (error) {
    console.error('Error in analyzeResumeAction:', error); // Log the actual error for debugging
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
    }
    if (error instanceof Error) {
      // Propagate the error message from the flows or other operations.
      // Specific messages like "Unsupported file type..." or "Failed to process..." will be passed through.
      throw new Error(error.message || 'An unexpected error occurred during analysis.');
    }
    // Fallback for non-Error exceptions (less common)
    throw new Error('An unknown error occurred during analysis.');
  }
}


// --- Generation Action ---
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

type GenerationActionResult = {
    resumeText: string;
    generationId: string | null; // Add ID for reference if needed
};

export async function generateResumeAction(input: GenerationActionInput): Promise<GenerationActionResult> {
    const validatedInput = generationActionInputSchema.parse(input);

    try {
        const result = await generateResume(validatedInput);

         if (!result || !result.resumeText) {
            throw new Error('AI failed to generate resume content.');
        }

        // Save to Firestore
        const generationId = await saveGeneratedResume({
            input: validatedInput,
            output: result,
            createdAt: new Date() as any, // Placeholder, serverTimestamp added in service
        });

        if (!generationId) {
            console.warn('Failed to save generated resume to Firestore.');
            // Optionally throw an error or return a specific status if saving is critical
        }

        return {
            ...result,
            generationId: generationId,
        };
    } catch (error) {
        console.error('Error in generateResumeAction:', error);
         if (error instanceof z.ZodError) {
            throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
        }
         if (error instanceof Error) {
             // Propagate specific error messages
             throw new Error(error.message || 'An unexpected error occurred during resume generation.');
         }
        throw new Error('Failed to generate resume due to an unknown error.');
    }
}
