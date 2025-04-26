'use client';

import * as React from 'react';
import { Award, Briefcase, GraduationCap, Loader2, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { ExtractResumeEntitiesOutput } from '@/ai/flows/extract-resume-entities';
import type { JobFitScoringOutput } from '@/ai/flows/job-fit-scoring';

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
}> = ({ title, icon, children }) => (
  <div className="mb-6">
    <div className="mb-3 flex items-center space-x-2">
      <span className="text-primary">{icon}</span>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="pl-8">{children}</div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-6 w-1/3 animate-pulse rounded bg-muted"></div>
      <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
      <div className="h-4 w-5/6 animate-pulse rounded bg-muted"></div>
    </div>
    <Separator />
    <div className="space-y-2">
      <div className="h-6 w-1/4 animate-pulse rounded bg-muted"></div>
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted"></div>
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted"></div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted"></div>
      </div>
    </div>
     <Separator />
    <div className="space-y-2">
       <div className="h-6 w-1/4 animate-pulse rounded bg-muted"></div>
       <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
       <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
    </div>
     <Separator />
     <div className="space-y-2">
       <div className="h-6 w-1/4 animate-pulse rounded bg-muted"></div>
       <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
    </div>
  </div>
);

export default function ResultsDisplay({
  result,
  isLoading,
}: ResultsDisplayProps) {
  const scorePercentage = result?.scoring?.fitScore ? Math.round(result.scoring.fitScore * 100) : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
             <LoadingSkeleton />
          </div>
        ) : !result ? (
          <div className="text-center text-muted-foreground">
            Enter resume and job description details to see the analysis.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job Fit Score */}
            <Section title="Job Fit Score" icon={<Target className="h-5 w-5" />}>
              <div className="flex items-center space-x-4">
                <Progress value={scorePercentage} className="h-3 flex-1" />
                <span className="font-semibold text-primary">{scorePercentage}%</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {result.scoring.justification}
              </p>
            </Section>

            <Separator />

            {/* Skills */}
            {result.entities.skills?.length > 0 && (
              <Section title="Skills" icon={<Award className="h-5 w-5" />}>
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
              <Section title="Experience" icon={<Briefcase className="h-5 w-5" />}>
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
              <Section title="Education" icon={<GraduationCap className="h-5 w-5" />}>
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
