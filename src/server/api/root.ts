import { createTRPCRouter } from "./trpc/init";
import { projectRouter } from "./routers/project";
import { repoRouter } from "./routers/repo";
import { featureRouter } from "./routers/feature";
import { prdRouter } from "./routers/prd";

export const appRouter = createTRPCRouter({
  project: projectRouter,
  repo: repoRouter,
  feature: featureRouter,
  prd: prdRouter,
});

export type AppRouter = typeof appRouter;
