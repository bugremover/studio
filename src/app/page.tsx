
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { FileUp, Loader2, X, Bot, ClipboardEdit } from 'lucide-react'; // Added Bot, ClipboardEdit

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs
import { useToast } from '@/hooks/use-toast';
import type { ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import type { JobFitScoringOutput } from '@/ai/flows/job-fit-scoring';
import type { GenerateResumeOutput } from '@/ai/flows/generate-resume'; // Import generation output type
import { analyzeResumeAction, generateResumeAction } from './actions'; // Import both actions
import ResultsDisplay from '@/components/results-display';
import GenerationDisplay from '@/components/generation-display'; // New component for generation results
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select

// --- Analysis Schemas and Types ---
const analysisFormSchema = z.object({
  resumeText: z.string().min(50, 'Resume content must be extracted and be at least 50 characters.'),
  jobDescription: z
    .string()
    .min(50, 'Job description must be at least 50 characters.'),
});
type AnalysisFormData = z.infer<typeof analysisFormSchema>;
type AnalysisResult = {
  entities: ExtractResumeEntitiesOutput;
  scoring: JobFitScoringOutput;
};

// --- Generation Schemas and Types ---
const generationFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  contactInfo: z.string().min(1, 'Contact information is required.'),
  skills: z.string().min(10, 'Please provide some details about your skills.'),
  experience: z.string().min(20, 'Please provide some details about your experience.'),
  education: z.string().min(10, 'Please provide some details about your education.'),
  targetJobDescription: z.string().optional(),
  tone: z.enum(['professional', 'creative', 'technical']).default('professional'),
});
type GenerationFormData = z.infer<typeof generationFormSchema>;
type GenerationResult = GenerateResumeOutput;

export default function Home() {
  // Analysis State
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = React.useState(false);
  const [resumeFileName, setResumeFileName] = React.useState<string | null>(null);
  const analysisFileInputRef = React.useRef<HTMLInputElement>(null);

  // Generation State
  const [generationResult, setGenerationResult] = React.useState<GenerationResult | null>(null);
  const [isGenerationLoading, setIsGenerationLoading] = React.useState(false);

  const { toast } = useToast();

  // Analysis Form
  const analysisForm = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      resumeText: '',
      jobDescription: '',
    },
  });

  // Generation Form
  const generationForm = useForm<GenerationFormData>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: {
      fullName: '',
      contactInfo: '',
      skills: '',
      experience: '',
      education: '',
      targetJobDescription: '',
      tone: 'professional',
    },
  });

  // --- Analysis Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('text/') && file.type !== 'application/pdf' && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
         toast({
            title: 'Invalid File Type',
            description: 'Please upload a text-based file (e.g., .txt, .md) or PDF.',
            variant: 'destructive',
         });
         if (analysisFileInputRef.current) analysisFileInputRef.current.value = '';
         setResumeFileName(null);
         analysisForm.setValue('resumeText', '', { shouldValidate: true });
         return;
      }

      setResumeFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        analysisForm.setValue('resumeText', text, { shouldValidate: true });
      };
      reader.onerror = (e) => {
        console.error('File reading error:', e);
        toast({ title: 'Error Reading File', description: 'Could not read the selected file.', variant: 'destructive' });
        setResumeFileName(null);
        analysisForm.setValue('resumeText', '', { shouldValidate: true });
        if (analysisFileInputRef.current) analysisFileInputRef.current.value = '';
      };
      reader.readAsText(file);
    } else {
        setResumeFileName(null);
        analysisForm.setValue('resumeText', '', { shouldValidate: true });
    }
  };

  const clearFile = () => {
    if (analysisFileInputRef.current) analysisFileInputRef.current.value = '';
    setResumeFileName(null);
    analysisForm.setValue('resumeText', '', { shouldValidate: true });
  };

  const onAnalysisSubmit: SubmitHandler<AnalysisFormData> = async (data) => {
    if (!data.resumeText || data.resumeText.length < 50) {
        analysisForm.setError('resumeText', { type: 'manual', message: 'Please upload a valid resume file.' });
        toast({ title: 'Missing Resume', description: 'Please upload a resume file before analyzing.', variant: 'destructive' });
        return;
    }

    setIsAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeResumeAction(data);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({ title: 'Error', description: 'Failed to analyze the resume. Please check the inputs and try again.', variant: 'destructive' });
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // --- Generation Handler ---
  const onGenerationSubmit: SubmitHandler<GenerationFormData> = async (data) => {
    setIsGenerationLoading(true);
    setGenerationResult(null);
    try {
      const result = await generateResumeAction(data);
      setGenerationResult(result);
    } catch (error) {
      console.error('Generation failed:', error);
      toast({ title: 'Error', description: 'Failed to generate the resume. Please check the inputs and try again.', variant: 'destructive' });
    } finally {
      setIsGenerationLoading(false);
    }
  };

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="mb-8 text-center text-3xl font-bold text-primary md:text-4xl">
        Resume Insights AI
      </h1>

      <Tabs defaultValue="analyze" className="w-full max-w-6xl">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="analyze">
            <ClipboardEdit className="mr-2 h-4 w-4" /> Analyze Resume
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Bot className="mr-2 h-4 w-4" /> Generate Resume
          </TabsTrigger>
        </TabsList>

        {/* Analysis Tab Content */}
        <TabsContent value="analyze">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Analyze Existing Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...analysisForm}>
                  <form onSubmit={analysisForm.handleSubmit(onAnalysisSubmit)} className="space-y-6">
                    <FormItem>
                      <FormLabel>Resume File</FormLabel>
                      <FormControl>
                         <div className="flex items-center space-x-2">
                            <Input
                                id="resume-file" type="file" ref={analysisFileInputRef} className="hidden"
                                accept=".txt,.md,text/plain,application/pdf" onChange={handleFileChange}
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => analysisFileInputRef.current?.click()}>
                               <FileUp className="mr-2 h-4 w-4" /> Upload File
                            </Button>
                            {resumeFileName && (
                                <div className="flex items-center space-x-1 rounded-md border bg-secondary px-2 py-1 text-sm text-secondary-foreground">
                                    <span className="max-w-[200px] truncate">{resumeFileName}</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={clearFile}>
                                        <X className="h-3 w-3" /><span className="sr-only">Remove file</span>
                                    </Button>
                                </div>
                            )}
                         </div>
                       </FormControl>
                       <FormMessage>{analysisForm.formState.errors.resumeText?.message}</FormMessage>
                    </FormItem>

                    <FormField
                      control={analysisForm.control} name="jobDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Job Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Paste the full job description here..." className="min-h-[200px] rounded-lg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full rounded-lg" disabled={isAnalysisLoading || !analysisForm.formState.isValid}>
                      {isAnalysisLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze Resume'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <ResultsDisplay result={analysisResult} isLoading={isAnalysisLoading} />
          </div>
        </TabsContent>

        {/* Generation Tab Content */}
        <TabsContent value="generate">
         <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Generate New Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...generationForm}>
                  <form onSubmit={generationForm.handleSubmit(onGenerationSubmit)} className="space-y-6">
                    <FormField control={generationForm.control} name="fullName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={generationForm.control} name="contactInfo" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Information</FormLabel>
                          <FormControl><Input placeholder="e.g., email@example.com | 555-1234 | linkedin.com/in/..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={generationForm.control} name="skills" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skills</FormLabel>
                          <FormControl><Textarea placeholder="List your key skills, separated by commas or new lines..." className="min-h-[100px]" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={generationForm.control} name="experience" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Experience</FormLabel>
                          <FormControl><Textarea placeholder="Describe your previous roles, companies, dates, and responsibilities..." className="min-h-[150px]" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={generationForm.control} name="education" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Education</FormLabel>
                          <FormControl><Textarea placeholder="List your degrees, institutions, and graduation dates..." className="min-h-[100px]" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={generationForm.control} name="targetJobDescription" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Job Description (Optional)</FormLabel>
                          <FormControl><Textarea placeholder="Paste a job description to tailor the resume towards it..." className="min-h-[150px]" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={generationForm.control} name="tone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Resume Tone</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a tone" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="creative">Creative</SelectItem>
                                    <SelectItem value="technical">Technical</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                     )}/>

                    <Button type="submit" className="w-full rounded-lg" disabled={isGenerationLoading}>
                      {isGenerationLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Resume'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
             <GenerationDisplay result={generationResult} isLoading={isGenerationLoading} />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
