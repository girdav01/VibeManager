"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityLevel } from "@prisma/client";

interface SecurityOverviewProps {
  riskScore: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export function SecurityOverview({
  riskScore,
  totalVulnerabilities,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
}: SecurityOverviewProps) {
  const getRiskLevel = (score: number) => {
    if (score >= 75) return { label: "Critical", color: "bg-red-500" };
    if (score >= 50) return { label: "High", color: "bg-orange-500" };
    if (score >= 25) return { label: "Medium", color: "bg-yellow-500" };
    return { label: "Low", color: "bg-green-500" };
  };

  const risk = getRiskLevel(riskScore);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">{riskScore}/100</div>
            <Badge className={risk.color}>{risk.label}</Badge>
          </div>
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${risk.color}`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vulnerabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVulnerabilities}</div>
          <p className="text-xs text-muted-foreground">Across all severity levels</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical & High</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {criticalCount + highCount}
          </div>
          <p className="text-xs text-muted-foreground">
            {criticalCount} critical, {highCount} high
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medium & Low</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {mediumCount + lowCount}
          </div>
          <p className="text-xs text-muted-foreground">
            {mediumCount} medium, {lowCount} low
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
