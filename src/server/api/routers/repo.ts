import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc/init";
import { TRPCError } from "@trpc/server";
import { repoIngestionService } from "@/server/services/repo-ingestion";

export const repoRouter = createTRPCRouter({
  // Connect a GitHub repo to a project
  connect: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        githubUrl: z.string().url(),
        branch: z.string().default("main"),
        accessToken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project || project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not found or access denied",
        });
      }

      // Create repo record
      const repo = await ctx.db.repo.create({
        data: {
          projectId: input.projectId,
          githubUrl: input.githubUrl,
          branch: input.branch,
          accessToken: input.accessToken,
        },
      });

      // Trigger async ingestion
      repoIngestionService.ingestRepo(repo.id).catch((error) => {
        console.error("Repo ingestion failed:", error);
      });

      return repo;
    }),

  // Get repo by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = await ctx.db.repo.findUnique({
        where: { id: input.id },
        include: {
          project: true,
        },
      });

      if (!repo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      if (repo.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return repo;
    }),

  // Trigger manual re-ingestion
  reingest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = await ctx.db.repo.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!repo || repo.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Repository not found or access denied",
        });
      }

      await repoIngestionService.ingestRepo(repo.id);

      return { success: true };
    }),

  // Get knowledge base
  getKnowledgeBase: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = await ctx.db.repo.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!repo || repo.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return repo.knowledgeBase;
    }),
});
