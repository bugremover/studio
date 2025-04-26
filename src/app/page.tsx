'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import type { ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import type { JobFitScoringOutput } from '@/ai/flows/job-fit-scoring';
import { analyzeResumeAction } from './actions';
import ResultsDisplay from '@/components/results-display';

const formSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters.'),
  jobDescription: z
    .string()
    .min(50, 'Job description must be at least 50 characters.'),
});

type FormData = z.infer<typeof formSchema>;

type AnalysisResult = {
  entities: ExtractResumeEntitiesOutput;
  scoring: JobFitScoringOutput;
};

export default function Home() {
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resumeText: '',
      jobDescription: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="resumeText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resume Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the full text of the resume here..."
                          className="min-h-[200px] rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  disabled={isLoading}
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
