import simpleGit from "simple-git";
import path from "path";
import fs from "fs/promises";
import { db } from "@/server/db";
import { frameworkDetector } from "./framework-detector";
import { codeAnalyzer } from "./code-analyzer";
import { securityAnalysisService } from "./security-analysis";

interface KnowledgeBase {
  framework: string;
  language: string;
  packageManager: string;
  domains: string[];
  routes: string[];
  models: string[];
  components: string[];
  services: string[];
  fileStructure: any;
}

class RepoIngestionService {
  private reposDir = path.join(process.cwd(), "tmp", "repos");

  async ingestRepo(repoId: string, options: { runSecurityScan?: boolean } = {}): Promise<void> {
    const { runSecurityScan = true } = options;

    const repo = await db.repo.findUnique({ where: { id: repoId } });
    if (!repo) {
      throw new Error("Repository not found");
    }

    const repoPath = path.join(this.reposDir, repoId);

    try {
      // Ensure repos directory exists
      await fs.mkdir(this.reposDir, { recursive: true });

      // Clone or pull repository
      await this.fetchRepo(repo.githubUrl, repo.branch, repoPath);

      // Analyze codebase
      const knowledgeBase = await this.analyzeRepo(repoPath);

      // Get latest commit SHA
      const git = simpleGit(repoPath);
      const log = await git.log({ maxCount: 1 });
      const commitSha = log.latest?.hash;

      // Update database
      await db.repo.update({
        where: { id: repoId },
        data: {
          knowledgeBase: knowledgeBase as any,
          lastIngestedAt: new Date(),
          lastCommitSha: commitSha,
        },
      });

      // Run security analysis if enabled
      if (runSecurityScan && commitSha) {
        console.log(`Running security analysis for repo ${repoId}...`);
        await securityAnalysisService.analyzeSecurity(
          repoId,
          repoPath,
          commitSha
        );
        console.log(`Security analysis completed for repo ${repoId}`);
      }

      // Clean up
      await fs.rm(repoPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to ingest repo ${repoId}:`, error);
      throw error;
    }
  }

  private async fetchRepo(
    githubUrl: string,
    branch: string,
    repoPath: string
  ): Promise<void> {
    const git = simpleGit();

    // Check if repo already exists
    const exists = await fs
      .access(repoPath)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      // Pull latest changes
      const repoGit = simpleGit(repoPath);
      await repoGit.pull("origin", branch);
    } else {
      // Clone repository
      await git.clone(githubUrl, repoPath, ["--depth", "1", "-b", branch]);
    }
  }

  private async analyzeRepo(repoPath: string): Promise<KnowledgeBase> {
    // Detect framework and language
    const framework = await frameworkDetector.detect(repoPath);

    // Analyze code structure
    const analysis = await codeAnalyzer.analyze(repoPath, framework.framework);

    return {
      framework: framework.framework,
      language: framework.language,
      packageManager: framework.packageManager,
      domains: analysis.domains,
      routes: analysis.routes,
      models: analysis.models,
      components: analysis.components,
      services: analysis.services,
      fileStructure: analysis.fileStructure,
    };
  }
}

export const repoIngestionService = new RepoIngestionService();
