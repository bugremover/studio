
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { FileUp, Loader2, X, Bot, ClipboardEdit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import type { JobFitScoringOutput } from '@/ai/flows/job-fit-scoring';
import type { GenerateResumeOutput } from '@/ai/flows/generate-resume';
import { analyzeResumeAction, generateResumeAction } from './actions';
import ResultsDisplay from '@/components/results-display';
import GenerationDisplay from '@/components/generation-display';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Analysis Schemas and Types ---
const analysisFormSchema = z.object({
  resumeDataUri: z.string().min(1, 'Please upload a resume file.').startsWith('data:', { message: 'Invalid file data format.' }),
  jobDescription: z
    .string()
    .min(50, 'Job description must be at least 50 characters.'),
});
type AnalysisFormData = z.infer<typeof analysisFormSchema>;
// Updated AnalysisResult type to include potential ID
type AnalysisResult = {
  entities: ExtractResumeEntitiesOutput;
  scoring: JobFitScoringOutput;
  analysisId: string | null;
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
// Updated GenerationResult type to include potential ID
type GenerationResult = {
    resumeText: string;
    generationId: string | null;
};

export default function Home() {
  // Analysis State
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = React.useState(false);
  const [resumeFileName, setResumeFileName] = React.useState<string | null>(null);
  const analysisFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isFileReading, setIsFileReading] = React.useState(false); // State for file reading

  // Generation State
  const [generationResult, setGenerationResult] = React.useState<GenerationResult | null>(null);
  const [isGenerationLoading, setIsGenerationLoading] = React.useState(false);

  const { toast } = useToast();

  // Analysis Form
  const analysisForm = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      resumeDataUri: '',
      jobDescription: '',
    },
    mode: 'onChange', // Validate on change for better UX
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
     mode: 'onChange', // Validate on change for better UX
  });

  // --- Analysis Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
       // Basic validation (consider more robust checks if needed)
      if (file.size > 5 * 1024 * 1024) { // Limit file size (e.g., 5MB)
         toast({
            title: 'File Too Large',
            description: 'Please upload a file smaller than 5MB.',
            variant: 'destructive',
         });
         clearFile();
         return;
      }

      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      // Check if it's a supported PDF/Word format
      if (fileType === 'application/pdf' || fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx') ) {
          setIsFileReading(true); // Start file reading indicator
          setResumeFileName(file.name);
          analysisForm.setValue('resumeDataUri', '', { shouldValidate: false }); // Clear previous data URI

          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              analysisForm.setValue('resumeDataUri', base64String, { shouldValidate: true }); // Set Base64 data URI and validate
              analysisForm.clearErrors('resumeDataUri');
              setIsFileReading(false); // Stop file reading indicator
          };
          reader.onerror = () => {
              console.error('File reading error');
              toast({
                 title: 'File Read Error',
                 description: 'Could not read the selected file.',
                 variant: 'destructive',
              });
              clearFile();
              setIsFileReading(false); // Stop file reading indicator on error
          }
          reader.readAsDataURL(file); // Read file as Data URL

      } else {
          // Handle other unsupported file types
           toast({
              title: 'Invalid File Type',
              description: 'Please upload a .pdf, .doc, or .docx file.',
              variant: 'destructive',
           });
           clearFile(); // Clear if unsupported type
           return;
      }

    } else {
        clearFile();
    }
  };

  const clearFile = () => {
    if (analysisFileInputRef.current) analysisFileInputRef.current.value = '';
    setResumeFileName(null);
    analysisForm.resetField('resumeDataUri', { defaultValue: '' }); // Reset data URI field
    analysisForm.clearErrors('resumeDataUri'); // Clear any previous errors
  };

  const onAnalysisSubmit: SubmitHandler<AnalysisFormData> = async (data) => {
    if (!data.resumeDataUri) {
        analysisForm.setError('resumeDataUri', { type: 'manual', message: 'Please upload a resume file.' });
        toast({ title: 'Missing Resume File', description: 'Please upload a valid resume (.pdf, .doc, .docx) before analyzing.', variant: 'destructive' });
        return;
    }

    setIsAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeResumeAction({
        resumeDataUri: data.resumeDataUri,
        jobDescription: data.jobDescription,
      });
      setAnalysisResult(result);
       toast({
          title: 'Analysis Complete',
          description: `Resume analyzed successfully. ${result.analysisId ? 'Saved to database.' : 'Failed to save to database.'}`,
          variant: result.analysisId ? 'default' : 'destructive',
       });
    } catch (error: any) {
      console.error('Analysis failed:', error);
       toast({ title: 'Analysis Error', description: error.message || 'Failed to analyze the resume. Please check the inputs and try again.', variant: 'destructive' });
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
       toast({
          title: 'Generation Complete',
          description: `Resume generated successfully. ${result.generationId ? 'Saved to database.' : 'Failed to save to database.'}`,
          variant: result.generationId ? 'default' : 'destructive',
       });
    } catch (error: any) {
      console.error('Generation failed:', error);
      toast({ title: 'Generation Error', description: error.message || 'Failed to generate the resume. Please check the inputs and try again.', variant: 'destructive' });
    } finally {
      setIsGenerationLoading(false);
    }
  };

  const isAnalyzeButtonDisabled = isAnalysisLoading || isFileReading || !analysisForm.formState.isValid;

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background to-muted/30 dark:from-background dark:to-secondary/20">
        <main className="container mx-auto flex flex-grow flex-col items-center p-4 pt-10 md:p-8">
            <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-primary md:text-4xl">
                Resume Insights AI
            </h1>
            <p className="mb-8 text-center text-lg text-muted-foreground">
                Analyze, score, and generate professional resumes with AI.
            </p>

            <Tabs defaultValue="analyze" className="w-full max-w-6xl">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 dark:bg-secondary/50">
                <TabsTrigger value="analyze" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <ClipboardEdit className="mr-2 h-4 w-4" /> Analyze Resume
                </TabsTrigger>
                <TabsTrigger value="generate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    <Bot className="mr-2 h-4 w-4" /> Generate Resume
                </TabsTrigger>
                </TabsList>

                {/* Analysis Tab Content */}
                <TabsContent value="analyze">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <Card className="shadow-lg border border-border/50 rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-xl">Analyze Existing Resume</CardTitle>
                         <CardDescription>Upload your resume (.pdf, .doc, .docx) and paste a job description to get AI insights.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...analysisForm}>
                        <form onSubmit={analysisForm.handleSubmit(onAnalysisSubmit)} className="space-y-6">
                            <FormField
                                control={analysisForm.control} name="resumeDataUri"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Resume File (.pdf, .doc, .docx)</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                id="resume-file" type="file" ref={analysisFileInputRef} className="hidden"
                                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                onChange={handleFileChange}
                                                disabled={isFileReading} // Disable while reading
                                            />
                                            <Button type="button" variant="outline" size="sm" onClick={() => analysisFileInputRef.current?.click()} className="rounded-lg" disabled={isFileReading}>
                                                {isFileReading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading...</> : <><FileUp className="mr-2 h-4 w-4" /> Upload File</>}
                                            </Button>
                                            {resumeFileName && (
                                                <div className="flex items-center space-x-1 rounded-lg border bg-secondary px-2 py-1 text-sm text-secondary-foreground">
                                                    <span className="max-w-[200px] truncate">{resumeFileName}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={clearFile} disabled={isFileReading}>
                                                        <X className="h-3 w-3" /><span className="sr-only">Remove file</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                     <FormMessage />
                                     {/* Hidden Input to store the data URI */}
                                     <Input {...field} type="hidden" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                            control={analysisForm.control} name="jobDescription"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Target Job Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Paste the full job description here..." className="min-h-[200px] rounded-lg border-input focus:border-primary" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" className="w-full rounded-lg shadow-md hover:shadow-lg transition-shadow" disabled={isAnalyzeButtonDisabled}>
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
                    <Card className="shadow-lg border border-border/50 rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-xl">Generate New Resume</CardTitle>
                        <CardDescription>Provide your details and let the AI craft a resume for you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...generationForm}>
                        <form onSubmit={generationForm.handleSubmit(onGenerationSubmit)} className="space-y-4"> {/* Reduced space */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Two columns for name/contact */}
                                <FormField control={generationForm.control} name="fullName" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Jane Doe" {...field} className="rounded-lg border-input focus:border-primary"/></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={generationForm.control} name="contactInfo" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Contact Information</FormLabel>
                                    <FormControl><Input placeholder="Email | Phone | LinkedIn" {...field} className="rounded-lg border-input focus:border-primary"/></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <FormField control={generationForm.control} name="skills" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Skills</FormLabel>
                                <FormControl><Textarea placeholder="List your key skills (e.g., Python, Project Management, Communication)..." className="min-h-[80px] rounded-lg border-input focus:border-primary" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={generationForm.control} name="experience" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Work Experience</FormLabel>
                                <FormControl><Textarea placeholder="Describe your previous roles, companies, dates, and key responsibilities/achievements..." className="min-h-[120px] rounded-lg border-input focus:border-primary" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={generationForm.control} name="education" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Education</FormLabel>
                                <FormControl><Textarea placeholder="List your degrees, institutions, and graduation dates..." className="min-h-[80px] rounded-lg border-input focus:border-primary" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={generationForm.control} name="targetJobDescription" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Target Job Description (Optional)</FormLabel>
                                <FormControl><Textarea placeholder="Paste a job description to tailor the resume..." className="min-h-[100px] rounded-lg border-input focus:border-primary" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={generationForm.control} name="tone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Resume Tone</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-lg border-input focus:border-primary">
                                            <SelectValue placeholder="Select a tone" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-lg">
                                            <SelectItem value="professional">Professional</SelectItem>
                                            <SelectItem value="creative">Creative</SelectItem>
                                            <SelectItem value="technical">Technical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>

                            <Button type="submit" className="w-full rounded-lg shadow-md hover:shadow-lg transition-shadow" disabled={isGenerationLoading || !generationForm.formState.isValid}>
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
             <footer className="mt-12 text-center text-sm text-muted-foreground">
                 Powered by AI | Resume Insights &copy; {new Date().getFullYear()}
             </footer>
        </main>
    </div>
  );
}
