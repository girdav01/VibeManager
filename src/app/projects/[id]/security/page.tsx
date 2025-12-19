"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { SecurityOverview } from "@/components/security/SecurityOverview";
import { VulnerabilityList } from "@/components/security/VulnerabilityList";
import { RecommendationsList } from "@/components/security/RecommendationsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, RefreshCw, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project } = trpc.project.getById.useQuery({ id: projectId });
  const { data: summary } = trpc.security.getSecuritySummary.useQuery({ projectId });
  const { data: reports } = trpc.security.getProjectReports.useQuery({ projectId });

  const latestReport = reports?.[0];

  const { data: reportDetails, refetch: refetchReport } =
    trpc.security.getReportById.useQuery(
      { reportId: latestReport?.id || "" },
      { enabled: !!latestReport?.id }
    );

  const markVulnerabilityResolved = trpc.security.markVulnerabilityResolved.useMutation({
    onSuccess: () => {
      refetchReport();
    },
  });

  const markRecommendationImplemented = trpc.security.markRecommendationImplemented.useMutation({
    onSuccess: () => {
      refetchReport();
    },
  });

  const runSecurityScan = trpc.security.runSecurityScan.useMutation();

  const handleRunScan = async () => {
    if (!project?.repos[0]) return;
    await runSecurityScan.mutateAsync({ repoId: project.repos[0].id });
    window.location.reload();
  };

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">{project?.name}</p>
        </div>
        <Button onClick={handleRunScan} disabled={runSecurityScan.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${runSecurityScan.isPending ? "animate-spin" : ""}`} />
          {runSecurityScan.isPending ? "Scanning..." : "Run Security Scan"}
        </Button>
      </div>

      {summary.reposScanned === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No security scans yet</CardTitle>
            <CardDescription className="mb-4">
              Run your first security scan to identify vulnerabilities and risks
            </CardDescription>
            <Button onClick={handleRunScan} disabled={runSecurityScan.isPending}>
              <Shield className="h-4 w-4 mr-2" />
              Run First Scan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <SecurityOverview
            riskScore={summary.averageRiskScore}
            totalVulnerabilities={summary.totalVulnerabilities}
            criticalCount={summary.criticalCount}
            highCount={summary.highCount}
            mediumCount={summary.mediumCount}
            lowCount={summary.lowCount}
          />

          {reportDetails && (
            <div className="mt-8">
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Latest Scan Results</CardTitle>
                      <CardDescription>
                        Scanned on {new Date(reportDetails.scanDate).toLocaleString()}
                        {reportDetails.scanDuration && ` • Took ${Math.round(reportDetails.scanDuration / 1000)}s`}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={reportDetails.status === "COMPLETED" ? "default" : "secondary"}
                    >
                      {reportDetails.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Tabs defaultValue="vulnerabilities" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="vulnerabilities">
                    Vulnerabilities
                    {reportDetails.vulnerabilities.length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {reportDetails.vulnerabilities.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="recommendations">
                    Recommendations
                    {reportDetails.recommendations.length > 0 && (
                      <Badge className="ml-2">
                        {reportDetails.recommendations.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="dependencies">
                    Supply Chain
                    {reportDetails.dependencyRisks.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {reportDetails.dependencyRisks.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="vulnerabilities">
                  <VulnerabilityList
                    vulnerabilities={reportDetails.vulnerabilities}
                    onResolve={(id, resolved) =>
                      markVulnerabilityResolved.mutate({ vulnerabilityId: id, resolved })
                    }
                  />
                </TabsContent>

                <TabsContent value="recommendations">
                  <RecommendationsList
                    recommendations={reportDetails.recommendations}
                    onImplement={(id, implemented) =>
                      markRecommendationImplemented.mutate({
                        recommendationId: id,
                        implemented,
                      })
                    }
                  />
                </TabsContent>

                <TabsContent value="dependencies">
                  <div className="space-y-4">
                    {reportDetails.dependencyRisks.map((risk) => (
                      <Card key={risk.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {risk.packageName}@{risk.packageVersion}
                            </CardTitle>
                            <Badge
                              variant={
                                risk.riskLevel === "CRITICAL" || risk.riskLevel === "HIGH"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {risk.riskLevel} Risk
                            </Badge>
                          </div>
                          <CardDescription>
                            {risk.packageManager} package
                            {risk.isDeprecated && " • Deprecated"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            {risk.hasVulnerabilities && (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Has known vulnerabilities</span>
                              </div>
                            )}
                            {risk.suspiciousScore > 50 && (
                              <div className="flex items-center gap-2 text-orange-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>
                                  Suspicious score: {risk.suspiciousScore}/100
                                </span>
                              </div>
                            )}
                            {risk.license && (
                              <div>
                                <span className="font-medium">License:</span> {risk.license}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
}
