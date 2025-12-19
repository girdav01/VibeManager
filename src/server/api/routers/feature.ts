import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc/init";
import { TRPCError } from "@trpc/server";
import { FeatureStatus } from "@prisma/client";
import { aiService } from "@/server/services/ai";

export const featureRouter = createTRPCRouter({
  // List features for a project
  list: protectedProcedure
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

      return ctx.db.feature.findMany({
        where: { projectId: input.projectId },
        include: {
          prds: {
            select: {
              id: true,
              version: true,
              status: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  // Get feature by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const feature = await ctx.db.feature.findUnique({
        where: { id: input.id },
        include: {
          project: true,
          prds: {
            include: {
              tasks: true,
            },
            orderBy: { version: "desc" },
          },
        },
      });

      if (!feature) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found",
        });
      }

      if (feature.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return feature;
    }),

  // Create feature from idea
  createFromIdea: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        idea: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: { repos: true },
      });

      if (!project || project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Use AI to generate mindmap
      const mindmap = await aiService.generateMindmap(
        input.idea,
        project.repos[0]?.knowledgeBase
      );

      // Create feature
      return ctx.db.feature.create({
        data: {
          projectId: input.projectId,
          name: mindmap.name,
          description: input.idea,
          mindmapData: mindmap.data,
          domain: mindmap.domain,
          status: FeatureStatus.IDEA,
        },
      });
    }),

  // Update feature
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        mindmapData: z.any().optional(),
        status: z.nativeEnum(FeatureStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.db.feature.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!feature || feature.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Feature not found or access denied",
        });
      }

      const { id, ...data } = input;
      return ctx.db.feature.update({
        where: { id },
        data,
      });
    }),

  // Delete feature
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.db.feature.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!feature || feature.project.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return ctx.db.feature.delete({
        where: { id: input.id },
      });
    }),
});
