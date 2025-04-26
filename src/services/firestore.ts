
'use server';

import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import type { JobFitScoringOutput } from '@/ai/flows/job-fit-scoring';
import type { GenerateResumeOutput, GenerateResumeInput } from '@/ai/flows/generate-resume';

// --- Firestore Collections ---
const analysisCollection = collection(db, 'resumeAnalyses');
const generationCollection = collection(db, 'generatedResumes');

// --- Types for Firestore documents ---
interface AnalysisDocumentData {
  // Consider hashing or omitting large text fields in production
  // resumeText: string;
  // jobDescription: string;
  entities: ExtractResumeEntitiesOutput;
  scoring: JobFitScoringOutput;
  createdAt: ReturnType<typeof serverTimestamp>;
}

interface GenerationDocumentData {
  input: GenerateResumeInput;
  output: GenerateResumeOutput;
  createdAt: ReturnType<typeof serverTimestamp>;
}

// --- Service Functions ---

/**
 * Saves resume analysis results to Firestore.
 * @param data - The analysis data including entities and scoring.
 */
export async function saveAnalysis(
  data: AnalysisDocumentData
): Promise<string | null> {
  try {
    // Prepare data, ensure createdAt is set
    const docData = { ...data, createdAt: serverTimestamp() };
    const docRef = await addDoc(analysisCollection, docData);
    console.log('Analysis saved to Firestore with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving analysis to Firestore:', error);
    // Depending on requirements, you might re-throw or return an error indicator
    return null;
  }
}

/**
 * Saves generated resume details to Firestore.
 * @param data - The generation data including input parameters and output text.
 */
export async function saveGeneratedResume(
  data: GenerationDocumentData
): Promise<string | null> {
  try {
     // Prepare data, ensure createdAt is set
    const docData = { ...data, createdAt: serverTimestamp() };
    const docRef = await addDoc(generationCollection, docData);
    console.log('Generated resume saved to Firestore with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving generated resume to Firestore:', error);
    return null;
  }
}
