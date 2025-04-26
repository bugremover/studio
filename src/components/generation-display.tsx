'use client';

import * as React from 'react';
import { Clipboard, Download, Bot, Check } from 'lucide-react'; // Added Check icon
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import type { GenerateResumeOutput } from '@/ai/flows/generate-resume';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown

interface GenerationDisplayProps {
  result: GenerateResumeOutput | null;
  isLoading: boolean;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-6 w-1/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-6 w-1/3 mt-4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
     <Skeleton className="h-6 w-1/3 mt-4" />
    <Skeleton className="h-4 w-full" />
     <Skeleton className="h-4 w-2/3" />
  </div>
);

export default function GenerationDisplay({
  result,
  isLoading,
}: GenerationDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (result?.resumeText) {
      navigator.clipboard.writeText(result.resumeText).then(() => {
        setCopied(true);
        toast({
          title: 'Copied!',
          description: 'Resume text copied to clipboard.',
        });
        setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
      }).catch(err => {
         console.error('Failed to copy:', err);
         toast({
            title: 'Error',
            description: 'Failed to copy resume text.',
            variant: 'destructive',
         })
      });
    }
  };

  const handleDownload = () => {
    if (result?.resumeText) {
      const blob = new Blob([result.resumeText], { type: 'text/markdown;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'generated_resume.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
       toast({
          title: 'Downloading...',
          description: 'Your resume markdown file is downloading.',
        });
    }
  };

  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Generated Resume</CardTitle>
         {result && !isLoading && (
            <div className="flex space-x-2">
                 <Button variant="outline" size="icon" onClick={handleCopy} disabled={copied}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                    <span className="sr-only">Copy Resume Text</span>
                 </Button>
                 <Button variant="outline" size="icon" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download Resume (Markdown)</span>
                </Button>
            </div>
         )}
      </CardHeader>
      <CardContent className="p-0"> {/* Remove default padding */}
        <ScrollArea className="h-[calc(100vh-240px)]"> {/* Adjusted height */}
          {isLoading ? (
            <div className="p-6"> {/* Add padding for skeleton */}
                <LoadingSkeleton />
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                <Bot className="h-12 w-12 mb-4 text-primary" />
              <p>Fill in your details on the left to generate a new resume.</p>
            </div>
          ) : (
             // Render Markdown content
            <div className="prose prose-sm dark:prose-invert max-w-none p-6"> {/* Add padding for content */}
               <ReactMarkdown>{result.resumeText}</ReactMarkdown>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
