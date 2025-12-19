import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc/init";
import { TRPCError } from "@trpc/server";
import { securityAnalysisService } from "@/server/services/security-analysis";
import { repoIngestionService } from "@/server/services/repo-ingestion";

export const securityRouter = createTRPCRouter({
  // Get latest security report for a repo
  getLatestReport: protectedProcedure
    .input(z.object({ repoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = await ctx.db.repo.findUnique({
        where: { id: input.repoId },
        include: {
          project: true,
        },
      });

      if (!repo || repo.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const report = await ctx.db.securityReport.findFirst({
        where: { repoId: input.repoId },
        include: {
          vulnerabilities: {
            orderBy: { severity: "asc" },
          },
          dependencyRisks: {
            orderBy: { riskLevel: "asc" },
          },
          recommendations: {
            orderBy: { priority: "desc" },
          },
        },
        orderBy: { scanDate: "desc" },
      });

      return report;
    }),

  // Get security report by ID
  getReportById: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.db.securityReport.findUnique({
        where: { id: input.reportId },
        include: {
          repo: {
            include: {
              project: true,
            },
          },
          vulnerabilities: {
            orderBy: { severity: "asc" },
          },
          dependencyRisks: {
            orderBy: { riskLevel: "asc" },
          },
          recommendations: {
            orderBy: { priority: "desc" },
          },
        },
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Security report not found",
        });
      }

      if (report.repo.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return report;
    }),

  // Get all security reports for a project
  getProjectReports: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project || project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const reports = await ctx.db.securityReport.findMany({
        where: {
          repo: {
            projectId: input.projectId,
          },
        },
        include: {
          repo: true,
          _count: {
            select: {
              vulnerabilities: true,
              dependencyRisks: true,
              recommendations: true,
            },
          },
        },
        orderBy: { scanDate: "desc" },
      });

      return reports;
    }),

  // Trigger manual security scan
  runSecurityScan: protectedProcedure
    .input(z.object({ repoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = await ctx.db.repo.findUnique({
        where: { id: input.repoId },
        include: {
          project: true,
        },
      });

      if (!repo || repo.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Trigger repo ingestion with security scan
      await repoIngestionService.ingestRepo(repo.id, {
        runSecurityScan: true,
      });

      return { success: true, message: "Security scan started" };
    }),

  // Get vulnerability details
  getVulnerability: protectedProcedure
    .input(z.object({ vulnerabilityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const vulnerability = await ctx.db.vulnerability.findUnique({
        where: { id: input.vulnerabilityId },
        include: {
          securityReport: {
            include: {
              repo: {
                include: {
                  project: true,
                },
              },
            },
          },
        },
      });

      if (!vulnerability) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vulnerability not found",
        });
      }

      if (
        vulnerability.securityReport.repo.project.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return vulnerability;
    }),

  // Mark vulnerability as resolved
  markVulnerabilityResolved: protectedProcedure
    .input(
      z.object({
        vulnerabilityId: z.string(),
        resolved: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const vulnerability = await ctx.db.vulnerability.findUnique({
        where: { id: input.vulnerabilityId },
        include: {
          securityReport: {
            include: {
              repo: {
                include: {
                  project: true,
                },
              },
            },
          },
        },
      });

      if (!vulnerability) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vulnerability not found",
        });
      }

      if (
        vulnerability.securityReport.repo.project.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return ctx.db.vulnerability.update({
        where: { id: input.vulnerabilityId },
        data: { resolved: input.resolved },
      });
    }),

  // Mark recommendation as implemented
  markRecommendationImplemented: protectedProcedure
    .input(
      z.object({
        recommendationId: z.string(),
        implemented: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const recommendation = await ctx.db.securityRecommendation.findUnique({
        where: { id: input.recommendationId },
        include: {
          securityReport: {
            include: {
              repo: {
                include: {
                  project: true,
                },
              },
            },
          },
        },
      });

      if (!recommendation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recommendation not found",
        });
      }

      if (
        recommendation.securityReport.repo.project.userId !==
        ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return ctx.db.securityRecommendation.update({
        where: { id: input.recommendationId },
        data: { implemented: input.implemented },
      });
    }),

  // Get security summary for dashboard
  getSecuritySummary: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project || project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Get latest reports for each repo in project
      const repos = await ctx.db.repo.findMany({
        where: { projectId: input.projectId },
        include: {
          securityReports: {
            orderBy: { scanDate: "desc" },
            take: 1,
            include: {
              vulnerabilities: {
                where: { resolved: false },
              },
              dependencyRisks: true,
            },
          },
        },
      });

      const summary = {
        totalRepos: repos.length,
        reposScanned: repos.filter(
          (r) => r.securityReports.length > 0
        ).length,
        totalVulnerabilities: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        averageRiskScore: 0,
        highRiskRepos: 0,
      };

      for (const repo of repos) {
        const latestReport = repo.securityReports[0];
        if (latestReport) {
          summary.totalVulnerabilities += latestReport.vulnerabilities.length;
          summary.criticalCount += latestReport.criticalCount;
          summary.highCount += latestReport.highCount;
          summary.mediumCount += latestReport.mediumCount;
          summary.lowCount += latestReport.lowCount;
          summary.averageRiskScore += latestReport.riskScore;

          if (latestReport.riskScore >= 50) {
            summary.highRiskRepos++;
          }
        }
      }

      if (summary.reposScanned > 0) {
        summary.averageRiskScore = Math.round(
          summary.averageRiskScore / summary.reposScanned
        );
      }

      return summary;
    }),
});
