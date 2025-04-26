
'use client';

import * as React from 'react';
import { Award, Briefcase, GraduationCap, Target, Lightbulb, Search, Info } from 'lucide-react'; // Added Info icon
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardDescription
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import type { JobFitScoringOutput } from '@/ai/flows/job-fit-scoring';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

// Updated AnalysisResult type to include potential ID
type AnalysisResult = {
  entities: ExtractResumeEntitiesOutput;
  scoring: JobFitScoringOutput;
  analysisId: string | null; // Added optional analysisId
};

interface ResultsDisplayProps {
  result: AnalysisResult | null;
  isLoading: boolean;
}

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string; // Optional description for the section
}> = ({ title, icon, children, className = '', description }) => (
  <div className={`mb-6 last:mb-0 ${className}`}>
    <div className="mb-3 flex items-center space-x-3">
      <span className="text-primary rounded-full bg-primary/10 p-1.5">{icon}</span>
      <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
    <div className="pl-10">{children}</div> {/* Adjusted padding */}
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-8 p-6"> {/* Increased spacing */}
    {/* Score Skeleton */}
    <div className="flex flex-col items-center space-y-3">
        <Skeleton className="h-28 w-28 rounded-full" /> {/* Slightly larger */}
        <Skeleton className="h-5 w-3/4" /> {/* Taller */}
        <Skeleton className="h-4 w-1/2" />
    </div>
    <Separator />
    {/* Suggested Roles Skeleton */}
     <div className="space-y-3">
       <Skeleton className="h-6 w-1/3" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-28 rounded-lg" /> {/* Rectangular badges */}
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
    </div>
    <Separator />
     {/* Improvements Skeleton */}
     <div className="space-y-3">
       <Skeleton className="h-6 w-1/3" />
       <Skeleton className="h-4 w-full" />
       <Skeleton className="h-4 w-5/6" />
       <Skeleton className="h-4 w-full" />
    </div>
    <Separator />
    {/* Skills Skeleton */}
    <div className="space-y-3">
      <Skeleton className="h-6 w-1/4" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-7 w-16 rounded-lg" />
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>
    </div>
     <Separator />
     {/* Experience Skeleton */}
    <div className="space-y-3">
       <Skeleton className="h-6 w-1/4" />
       <Skeleton className="h-4 w-full" />
       <Skeleton className="h-4 w-full" />
       <Skeleton className="h-4 w-4/5" />
    </div>
     <Separator />
     {/* Education Skeleton */}
     <div className="space-y-3">
       <Skeleton className="h-6 w-1/4" />
       <Skeleton className="h-4 w-full" />
       <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

// Chart configuration for Fit Score Pie Chart
const chartConfig = {
  fit: { label: "Fit", color: "hsl(var(--primary))" }, // Use primary color
  remaining: { label: "Remaining", color: "hsl(var(--muted))" },
};

export default function ResultsDisplay({
  result,
  isLoading,
}: ResultsDisplayProps) {
  const scorePercentage = result?.scoring?.fitScore ? Math.round(result.scoring.fitScore * 100) : 0;
  const chartData = [
    { name: "fit", value: scorePercentage, fill: "var(--color-fit)" },
    { name: "remaining", value: 100 - scorePercentage, fill: "var(--color-remaining)" },
  ];

  const hasResults = !!result;
  const hasSuggestions = hasResults && (result.scoring.suggestedRoles?.length > 0 || result.scoring.improvementSuggestions?.length > 0);
  const hasEntities = hasResults && (result.entities.skills?.length > 0 || result.entities.experience?.length > 0 || result.entities.education?.length > 0);

  return (
    <Card className="shadow-lg overflow-hidden border border-border/50 rounded-xl h-full flex flex-col"> {/* Added flex flex-col */}
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-xl">Analysis Results</CardTitle>
        <CardDescription>Review the AI's analysis of the resume against the job description.</CardDescription>
      </CardHeader>
       <ScrollArea className="flex-grow"> {/* ScrollArea takes remaining space */}
         <CardContent className="p-6"> {/* Add padding back */}
            {isLoading ? (
             <LoadingSkeleton />
            ) : !hasResults ? (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20">
                <Info className="h-16 w-16 mb-4 text-primary/50" /> {/* Larger icon */}
                <p className="text-lg mb-1">No Analysis Yet</p>
                <p>Enter resume and job description details on the left to see the analysis here.</p>
              </div>
            ) : (
            <div className="space-y-8"> {/* Increased spacing */}
                {/* Job Fit Score */}
                <Section title="Job Fit Score" icon={<Target className="h-5 w-5" />}>
                <div className="flex flex-col items-center space-y-3">
                    <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-36" // Slightly larger chart
                    >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel hideIndicator />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40} // Adjusted inner radius
                            outerRadius={60} // Adjusted outer radius
                            strokeWidth={2} // Slightly thicker stroke
                            startAngle={90}
                            endAngle={450}
                        >
                            {chartData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                            {/* Label inside the donut */}
                             <text
                                x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                                className="fill-primary font-semibold text-2xl" // Style the text
                            >
                                {`${scorePercentage}%`}
                             </text>
                        </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    </ChartContainer>
                    {/* <span className="text-2xl font-bold text-primary">{scorePercentage}%</span> */}
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground italic">
                    "{result.scoring.justification}"
                </p>
                </Section>

                <Separator />

                {/* Suggestions Section (Combined) */}
                {hasSuggestions && (
                   <>
                     {result.scoring.suggestedRoles?.length > 0 && (
                        <Section title="Suggested Roles" icon={<Search className="h-5 w-5" />} description="Alternative roles based on the resume's content.">
                            <div className="flex flex-wrap gap-2">
                            {result.scoring.suggestedRoles.map((role, index) => (
                                <Badge key={index} variant="outline" className="rounded-md border-primary/50 text-primary bg-primary/10 px-3 py-1">
                                {role}
                                </Badge>
                            ))}
                            </div>
                        </Section>
                    )}

                     {result.scoring.improvementSuggestions?.length > 0 && (
                        <Section title="Improvement Suggestions" icon={<Lightbulb className="h-5 w-5" />} description="Tailored tips to better match the job description.">
                            <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
                            {result.scoring.improvementSuggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                            ))}
                            </ul>
                        </Section>
                    )}
                     <Separator />
                   </>
                )}


                {/* Extracted Entities Section (Combined) */}
                 {hasEntities && (
                   <>
                    {result.entities.skills?.length > 0 && (
                    <Section title="Extracted Skills" icon={<Award className="h-5 w-5" />} description="Skills identified in the resume.">
                        <div className="flex flex-wrap gap-2">
                        {result.entities.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="rounded-md px-3 py-1">
                            {skill}
                            </Badge>
                        ))}
                        </div>
                    </Section>
                    )}

                    {result.entities.experience?.length > 0 && (
                    <Section title="Extracted Experience" icon={<Briefcase className="h-5 w-5" />} description="Work history found in the resume.">
                        <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
                        {result.entities.experience.map((exp, index) => (
                            <li key={index}>{exp}</li>
                        ))}
                        </ul>
                    </Section>
                    )}

                    {result.entities.education?.length > 0 && (
                    <Section title="Extracted Education" icon={<GraduationCap className="h-5 w-5" />} description="Educational background listed.">
                        <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
                        {result.entities.education.map((edu, index) => (
                            <li key={index}>{edu}</li>
                        ))}
                        </ul>
                    </Section>
                    )}
                   </>
                )}
            </div>
            )}
        </CardContent>
       </ScrollArea>
    </Card>
  );
}
