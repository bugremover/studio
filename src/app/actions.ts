
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
        suggestedRoles: scoringResult.suggestedRoles ?? [],
        improvementSuggestions: scoringResult.improvementSuggestions ?? [],
    };

    // Save to Firestore
    const analysisId = await saveAnalysis({
      // Omit resumeDataUri from Firestore for brevity/security if needed
      // resumeDataUri: validatedInput.resumeDataUri, // Decide if you want to store the full file data
      jobDescription: validatedInput.jobDescription, // Store job description
      entities: entitiesResult,
      scoring: finalScoringResult,
      createdAt: new Date() as any, // Placeholder, serverTimestamp added in service
    });

    if (!analysisId) {
        console.warn('Failed to save analysis to Firestore.');
    }

    return {
      entities: entitiesResult,
      scoring: finalScoringResult,
      analysisId: analysisId,
    };
  } catch (error) {
    console.error('Error in analyzeResumeAction:', error);
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
    }
    // Check if error message indicates unsupported file type (this might come from the Genkit flows)
    if (error instanceof Error && error.message.includes('Unsupported file type')) {
        throw new Error('Unsupported file type. Please upload a PDF, DOC, or DOCX file.');
    }
    throw new Error('Failed to analyze resume. Check file format and content.');
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

        // Save to Firestore
        const generationId = await saveGeneratedResume({
            input: validatedInput,
            output: result,
            createdAt: new Date() as any, // Placeholder, serverTimestamp added in service
        });

        if (!generationId) {
            console.warn('Failed to save generated resume to Firestore.');
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
        throw new Error('Failed to generate resume.');
    }
}
