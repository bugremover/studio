
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { FileUp, Loader2, X } from 'lucide-react';

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
import { Input } from '@/components/ui/input'; // Import Input component
import { useToast } from '@/hooks/use-toast';
import type { ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import type { JobFitScoringOutput } from '@/ai/flows/job-fit-scoring'; // This type now includes suggestions
import { analyzeResumeAction } from './actions';
import ResultsDisplay from '@/components/results-display';
import { Label } from '@/components/ui/label'; // Import Label

const formSchema = z.object({
  // Keep resumeText, but it will be populated from the file
  resumeText: z.string().min(50, 'Resume content must be extracted and be at least 50 characters.'),
  jobDescription: z
    .string()
    .min(50, 'Job description must be at least 50 characters.'),
});

type FormData = z.infer<typeof formSchema>;

// Update AnalysisResult to use the extended JobFitScoringOutput type
type AnalysisResult = {
  entities: ExtractResumeEntitiesOutput;
  scoring: JobFitScoringOutput; // Now includes fitScore, justification, suggestedRoles, improvementSuggestions
};

export default function Home() {
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resumeFileName, setResumeFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resumeText: '', // Initialize as empty, will be set by file reader
      jobDescription: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic type check (adjust as needed)
      if (!file.type.startsWith('text/') && file.type !== 'application/pdf' && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
         toast({
            title: 'Invalid File Type',
            description: 'Please upload a text-based file (e.g., .txt, .md) or PDF.',
            variant: 'destructive',
         });
         // Clear the input
         if (fileInputRef.current) {
           fileInputRef.current.value = '';
         }
         setResumeFileName(null);
         form.setValue('resumeText', '', { shouldValidate: true }); // Clear resume text
         return;
      }

      setResumeFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        form.setValue('resumeText', text, { shouldValidate: true });
      };
      reader.onerror = (e) => {
        console.error('File reading error:', e);
        toast({
          title: 'Error Reading File',
          description: 'Could not read the selected file.',
          variant: 'destructive',
        });
        setResumeFileName(null);
        form.setValue('resumeText', '', { shouldValidate: true }); // Clear resume text
        // Clear the input
         if (fileInputRef.current) {
           fileInputRef.current.value = '';
         }
      };
      reader.readAsText(file); // Read as text
    } else {
        setResumeFileName(null);
        form.setValue('resumeText', '', { shouldValidate: true }); // Clear if no file selected
    }
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setResumeFileName(null);
    form.setValue('resumeText', '', { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // Ensure resume text has been populated
    if (!data.resumeText || data.resumeText.length < 50) {
        form.setError('resumeText', { type: 'manual', message: 'Please upload a valid resume file.' });
        toast({
            title: 'Missing Resume',
            description: 'Please upload a resume file before analyzing.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeResumeAction(data);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: 'Error',
        description:
          'Failed to analyze the resume. Please check the inputs and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="mb-8 text-center text-3xl font-bold text-primary md:text-4xl">
        Resume Insights
      </h1>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Input Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              {/* Use standard form element for submit handling */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Resume File Upload */}
                <FormItem>
                  <FormLabel>Resume File</FormLabel>
                   <FormControl>
                     <div className="flex items-center space-x-2">
                        <Input
                            id="resume-file"
                            type="file"
                            ref={fileInputRef}
                            className="hidden" // Hide default input
                            accept=".txt,.md,text/plain,application/pdf" // Specify accepted types
                            onChange={handleFileChange}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                           <FileUp className="mr-2 h-4 w-4" />
                           Upload File
                        </Button>
                        {resumeFileName && (
                            <div className="flex items-center space-x-1 rounded-md border bg-secondary px-2 py-1 text-sm text-secondary-foreground">
                                <span className="max-w-[200px] truncate">{resumeFileName}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={clearFile}>
                                    <X className="h-3 w-3" />
                                    <span className="sr-only">Remove file</span>
                                </Button>
                            </div>
                        )}
                     </div>
                   </FormControl>
                   {/* Manually display error for resumeText which is populated by file */}
                   <FormMessage>{form.formState.errors.resumeText?.message}</FormMessage>
                </FormItem>

                {/* Job Description */}
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the full job description here..."
                          className="min-h-[200px] rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full rounded-lg"
                  disabled={isLoading || !form.formState.isValid} // Disable if loading or form invalid
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    'Analyze Resume'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <ResultsDisplay result={analysisResult} isLoading={isLoading} />
      </div>
    </main>
  );
}
