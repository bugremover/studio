
'use client';

import * as React from 'react';
import { Clipboard, Download, Bot, Check, FileText } from 'lucide-react'; // Added Check, FileText icons
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardDescription
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { GenerateResumeOutput } from '@/ai/flows/generate-resume';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

// Updated GenerationResult type to include potential ID
type GenerationResult = {
    resumeText: string;
    generationId: string | null; // Added optional generationId
};

interface GenerationDisplayProps {
  result: GenerationResult | null;
  isLoading: boolean;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 p-6"> {/* Increased spacing */}
    <Skeleton className="h-8 w-1/3" /> {/* Taller title */}
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-full" />

    <Skeleton className="h-6 w-1/4 mt-6" /> {/* Section heading */}
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />

     <Skeleton className="h-6 w-1/3 mt-6" /> {/* Another section */}
    <Skeleton className="h-4 w-full" />
     <Skeleton className="h-4 w-2/3" />
     <Skeleton className="h-4 w-full" />
     <Skeleton className="h-4 w-1/2" />
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
        setTimeout(() => setCopied(false), 2500); // Reset icon after 2.5 seconds
      }).catch(err => {
         console.error('Failed to copy:', err);
         toast({
            title: 'Copy Error',
            description: 'Failed to copy resume text to clipboard.',
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
          description: 'Your generated resume (Markdown file) is downloading.',
        });
    }
  };

   const hasResult = !!result;

  return (
    <Card className="shadow-lg overflow-hidden border border-border/50 rounded-xl h-full flex flex-col"> {/* Ensure card takes height */}
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 border-b border-border/50">
        <div>
            <CardTitle className="text-xl">Generated Resume</CardTitle>
            <CardDescription>Preview the AI-generated resume below.</CardDescription>
        </div>
         {hasResult && !isLoading && (
            <div className="flex space-x-2 pt-1">
                 <Button variant="outline" size="icon" onClick={handleCopy} disabled={copied} className="rounded-lg" title="Copy Markdown">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                    <span className="sr-only">Copy Resume Text</span>
                 </Button>
                 <Button variant="outline" size="icon" onClick={handleDownload} className="rounded-lg" title="Download Markdown">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download Resume (Markdown)</span>
                </Button>
            </div>
         )}
      </CardHeader>
      <ScrollArea className="flex-grow"> {/* Scroll area takes remaining space */}
        {/* Removed CardContent to allow ScrollArea direct child */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : !hasResult ? (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6 py-20">
                <FileText className="h-16 w-16 mb-4 text-primary/50" /> {/* Larger icon */}
                <p className="text-lg mb-1">No Resume Generated Yet</p>
                <p>Fill in your details on the left and click "Generate Resume" to see the result here.</p>
             </div>
          ) : (
             // Apply prose styles for better Markdown rendering
            <div className="prose prose-sm dark:prose-invert max-w-none p-6">
               <ReactMarkdown
                 components={{ // Optional: Customize specific elements if needed
                   h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-primary mb-4" {...props} />,
                   h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-primary/90 mt-6 mb-3 border-b pb-1" {...props} />,
                   h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                   ul: ({node, ...props}) => <ul className="list-disc space-y-1 ml-5" {...props} />,
                   ol: ({node, ...props}) => <ol className="list-decimal space-y-1 ml-5" {...props} />,
                   p: ({node, ...props}) => <p className="leading-relaxed" {...props} />,
                   a: ({node, ...props}) => <a className="text-accent hover:underline" {...props} />,
                   // Add more customizations as needed
                 }}
               >
                 {result.resumeText}
               </ReactMarkdown>
            </div>
          )}
      </ScrollArea>
    </Card>
  );
}
