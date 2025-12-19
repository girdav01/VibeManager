import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc/init";
import { TRPCError } from "@trpc/server";
import { PRDStatus } from "@prisma/client";
import { aiService } from "@/server/services/ai";

export const prdRouter = createTRPCRouter({
  // Get PRD by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const prd = await ctx.db.pRD.findUnique({
        where: { id: input.id },
        include: {
          feature: {
            include: {
              project: true,
            },
          },
          tasks: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!prd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "PRD not found",
        });
      }

      if (prd.feature.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return prd;
    }),

  // Create PRD from feature
  create: protectedProcedure
    .input(
      z.object({
        featureId: z.string(),
        problemStatement: z.string().optional(),
        userStory: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.db.feature.findUnique({
        where: { id: input.featureId },
        include: {
          project: {
            include: {
              repos: true,
            },
          },
          prds: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      });

      if (!feature || feature.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const version = (feature.prds[0]?.version ?? 0) + 1;

      // Use AI to generate PRD content
      const prdContent = await aiService.generatePRD({
        featureName: feature.name,
        featureDescription: feature.description,
        mindmapData: feature.mindmapData,
        knowledgeBase: feature.project.repos[0]?.knowledgeBase,
        problemStatement: input.problemStatement,
        userStory: input.userStory,
      });

      return ctx.db.pRD.create({
        data: {
          featureId: input.featureId,
          version,
          status: PRDStatus.DRAFT,
          problemStatement:
            input.problemStatement || prdContent.problemStatement,
          userStory: input.userStory || prdContent.userStory,
          userFlows: prdContent.userFlows,
          routes: prdContent.routes,
          models: prdContent.models,
          components: prdContent.components,
          filePaths: prdContent.filePaths,
          acceptanceCriteria: prdContent.acceptanceCriteria,
          edgeCases: prdContent.edgeCases,
          dependencies: prdContent.dependencies,
        },
      });
    }),

  // Update PRD
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        problemStatement: z.string().optional(),
        userStory: z.string().optional(),
        userFlows: z.array(z.any()).optional(),
        routes: z.array(z.any()).optional(),
        models: z.array(z.any()).optional(),
        components: z.array(z.any()).optional(),
        filePaths: z.array(z.string()).optional(),
        acceptanceCriteria: z.array(z.string()).optional(),
        edgeCases: z.array(z.string()).optional(),
        status: z.nativeEnum(PRDStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prd = await ctx.db.pRD.findUnique({
        where: { id: input.id },
        include: {
          feature: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!prd || prd.feature.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const { id, ...data } = input;
      return ctx.db.pRD.update({
        where: { id },
        data,
      });
    }),

  // Generate export prompt for AI tools
  generateExport: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        format: z.enum(["cursor", "claude", "markdown"]).default("cursor"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prd = await ctx.db.pRD.findUnique({
        where: { id: input.id },
        include: {
          feature: {
            include: {
              project: {
                include: {
                  repos: true,
                },
              },
            },
          },
        },
      });

      if (!prd || prd.feature.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const exportPrompt = await aiService.generateExportPrompt(
        prd,
        input.format
      );

      // Update PRD with export prompt
      await ctx.db.pRD.update({
        where: { id: input.id },
        data: { exportPrompt },
      });

      return { exportPrompt };
    }),
});
