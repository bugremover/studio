'use client';

import * as React from 'react';
import { Award, Briefcase, GraduationCap, Target, Lightbulb, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import type { JobFitScoringOutput } from '@/ai/flows/job-fit-scoring'; // Includes suggestions now
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"; // Import chart components
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"; // Import recharts components
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Updated AnalysisResult type to reflect the full JobFitScoringOutput
type AnalysisResult = {
  entities: ExtractResumeEntitiesOutput;
  scoring: JobFitScoringOutput;
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
}> = ({ title, icon, children, className = '' }) => (
  <div className={`mb-6 ${className}`}>
    <div className="mb-3 flex items-center space-x-2">
      <span className="text-primary">{icon}</span>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="pl-8">{children}</div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Score Skeleton */}
    <div className="flex flex-col items-center space-y-2">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
    </div>
    <Separator />
    {/* Skills Skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-6 w-1/4" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
     <Separator />
     {/* Experience Skeleton */}
    <div className="space-y-2">
       <Skeleton className="h-6 w-1/4" />
       <Skeleton className="h-4 w-full" />
       <Skeleton className="h-4 w-full" />
    </div>
     <Separator />
     {/* Education Skeleton */}
     <div className="space-y-2">
       <Skeleton className="h-6 w-1/4" />
       <Skeleton className="h-4 w-full" />
    </div>
    <Separator />
     {/* Suggested Roles Skeleton */}
     <div className="space-y-2">
       <Skeleton className="h-6 w-1/3" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
    </div>
    <Separator />
     {/* Improvements Skeleton */}
     <div className="space-y-2">
       <Skeleton className="h-6 w-1/3" />
       <Skeleton className="h-4 w-full" />
       <Skeleton className="h-4 w-5/6" />
    </div>
  </div>
);

// Chart configuration for Fit Score Pie Chart
const chartConfig = {
  fit: { label: "Fit", color: "hsl(var(--chart-1))" },
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

  return (
    <Card className="shadow-lg overflow-hidden"> {/* Added overflow-hidden */}
      <CardHeader>
        <CardTitle className="text-xl">Analysis Results</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto"> {/* Scrollable content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
             <LoadingSkeleton />
          </div>
        ) : !result ? (
          <div className="text-center text-muted-foreground py-10">
            Enter resume and job description details to see the analysis.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job Fit Score */}
            <Section title="Job Fit Score" icon={<Target className="h-5 w-5" />}>
              <div className="flex flex-col items-center space-y-2">
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square h-32" // Adjusted size
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
                        innerRadius={35} // Made the donut hole smaller
                        outerRadius={50} // Made the chart slightly smaller
                        strokeWidth={1}
                        startAngle={90}
                        endAngle={450} // Full circle
                      >
                        {chartData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <span className="text-2xl font-bold text-primary">{scorePercentage}%</span>
              </div>
               <p className="mt-3 text-center text-sm text-muted-foreground">
                {result.scoring.justification}
              </p>
            </Section>

            <Separator />

            {/* Suggested Roles */}
            {result.scoring.suggestedRoles?.length > 0 && (
              <Section title="Suggested Roles" icon={<Search className="h-5 w-5" />}>
                <div className="flex flex-wrap gap-2">
                  {result.scoring.suggestedRoles.map((role, index) => (
                    <Badge key={index} variant="outline" className="rounded-md border-primary text-primary">
                      {role}
                    </Badge>
                  ))}
                </div>
                 <p className="mt-2 text-xs text-muted-foreground">
                    Based on skills and experience found in the resume.
                 </p>
              </Section>
            )}

            <Separator />

            {/* Improvement Suggestions */}
            {result.scoring.improvementSuggestions?.length > 0 && (
              <Section title="Improvement Suggestions" icon={<Lightbulb className="h-5 w-5" />}>
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  {result.scoring.improvementSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
                 <p className="mt-2 text-xs text-muted-foreground">
                    Tailored suggestions to better match the provided job description.
                 </p>
              </Section>
            )}

            <Separator />

            {/* Skills */}
            {result.entities.skills?.length > 0 && (
              <Section title="Extracted Skills" icon={<Award className="h-5 w-5" />}>
                <div className="flex flex-wrap gap-2">
                  {result.entities.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="rounded-full">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Section>
            )}

             <Separator />

            {/* Experience */}
            {result.entities.experience?.length > 0 && (
              <Section title="Extracted Experience" icon={<Briefcase className="h-5 w-5" />}>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {result.entities.experience.map((exp, index) => (
                    <li key={index}>{exp}</li>
                  ))}
                </ul>
              </Section>
            )}

             <Separator />

            {/* Education */}
            {result.entities.education?.length > 0 && (
              <Section title="Extracted Education" icon={<GraduationCap className="h-5 w-5" />}>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {result.entities.education.map((edu, index) => (
                    <li key={index}>{edu}</li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
