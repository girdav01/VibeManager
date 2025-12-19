"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeverityLevel } from "@prisma/client";
import { CheckCircle2, Clock } from "lucide-react";

interface SecurityRecommendation {
  id: string;
  severity: SeverityLevel;
  category: string;
  title: string;
  description: string;
  steps: string[];
  estimatedEffort?: string | null;
  priority: number;
  implemented: boolean;
}

interface RecommendationsListProps {
  recommendations: SecurityRecommendation[];
  onImplement?: (id: string, implemented: boolean) => void;
}

export function RecommendationsList({
  recommendations,
  onImplement,
}: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">No recommendations at this time</p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: SeverityLevel) => {
    const colors: Record<SeverityLevel, string> = {
      CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      INFO: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[severity];
  };

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <Card key={rec.id} className={rec.implemented ? "opacity-60" : ""}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(rec.severity)}>
                    {rec.severity}
                  </Badge>
                  <Badge variant="outline">{rec.category}</Badge>
                  <Badge variant="outline">Priority: {rec.priority}</Badge>
                  {rec.estimatedEffort && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rec.estimatedEffort}
                    </Badge>
                  )}
                  {rec.implemented && (
                    <Badge variant="outline" className="bg-green-50">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Implemented
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{rec.title}</CardTitle>
                <CardDescription>{rec.description}</CardDescription>
              </div>
              {onImplement && (
                <Button
                  variant={rec.implemented ? "outline" : "default"}
                  size="sm"
                  onClick={() => onImplement(rec.id, !rec.implemented)}
                >
                  {rec.implemented ? "Mark Not Done" : "Mark Done"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium text-sm">Steps to implement:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {rec.steps.map((step, index) => (
                  <li key={index} className="text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
