import fs from "fs/promises";
import path from "path";

interface AnalysisResult {
  domains: string[];
  routes: string[];
  models: string[];
  components: string[];
  services: string[];
  fileStructure: FileNode;
}

interface FileNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
}

class CodeAnalyzer {
  private readonly IGNORE_PATTERNS = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "out",
    "coverage",
    "__pycache__",
    ".pytest_cache",
    "venv",
    "env",
  ];

  async analyze(repoPath: string, framework: string): Promise<AnalysisResult> {
    const fileStructure = await this.buildFileStructure(repoPath);

    // Framework-specific analysis
    let routes: string[] = [];
    let models: string[] = [];
    let components: string[] = [];
    let services: string[] = [];
    let domains: string[] = [];

    if (framework === "Next.js") {
      routes = await this.extractNextJSRoutes(repoPath);
      components = await this.extractReactComponents(repoPath);
      models = await this.extractPrismaModels(repoPath);
    } else if (framework === "Django") {
      routes = await this.extractDjangoRoutes(repoPath);
      models = await this.extractDjangoModels(repoPath);
    } else if (framework === "Rails") {
      routes = await this.extractRailsRoutes(repoPath);
      models = await this.extractRailsModels(repoPath);
    } else if (framework === "Laravel") {
      routes = await this.extractLaravelRoutes(repoPath);
      models = await this.extractLaravelModels(repoPath);
    }

    // Extract domains from directory structure
    domains = this.inferDomains(fileStructure);

    return {
      domains,
      routes,
      models,
      components,
      services,
      fileStructure,
    };
  }

  private async buildFileStructure(
    dirPath: string,
    relativePath = ""
  ): Promise<FileNode> {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);

    if (stats.isFile()) {
      return {
        name,
        type: "file",
        path: relativePath,
      };
    }

    const children: FileNode[] = [];
    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
      if (this.IGNORE_PATTERNS.includes(entry)) continue;

      const fullPath = path.join(dirPath, entry);
      const entryRelativePath = path.join(relativePath, entry);

      try {
        const child = await this.buildFileStructure(fullPath, entryRelativePath);
        children.push(child);
      } catch (error) {
        // Skip inaccessible files
        continue;
      }
    }

    return {
      name,
      type: "directory",
      path: relativePath,
      children,
    };
  }

  private async extractNextJSRoutes(repoPath: string): Promise<string[]> {
    const routes: string[] = [];
    const appDir = path.join(repoPath, "app");
    const pagesDir = path.join(repoPath, "pages");

    // App Router (Next.js 13+)
    if (await this.directoryExists(appDir)) {
      const appRoutes = await this.scanForFiles(appDir, /page\.(tsx?|jsx?)$/);
      for (const route of appRoutes) {
        const routePath = route
          .replace(appDir, "")
          .replace(/\/page\.(tsx?|jsx?)$/, "")
          .replace(/\[([^\]]+)\]/g, ":$1");
        routes.push(routePath || "/");
      }
    }

    // Pages Router
    if (await this.directoryExists(pagesDir)) {
      const pageRoutes = await this.scanForFiles(pagesDir, /\.(tsx?|jsx?)$/);
      for (const route of pageRoutes) {
        const routePath = route
          .replace(pagesDir, "")
          .replace(/\.(tsx?|jsx?)$/, "")
          .replace(/\/index$/, "")
          .replace(/\[([^\]]+)\]/g, ":$1");
        routes.push(routePath || "/");
      }
    }

    // API Routes
    const apiDir = path.join(repoPath, "pages", "api");
    if (await this.directoryExists(apiDir)) {
      const apiRoutes = await this.scanForFiles(apiDir, /\.(tsx?|jsx?)$/);
      for (const route of apiRoutes) {
        const routePath = route
          .replace(apiDir, "/api")
          .replace(/\.(tsx?|jsx?)$/, "")
          .replace(/\/index$/, "")
          .replace(/\[([^\]]+)\]/g, ":$1");
        routes.push(routePath);
      }
    }

    return routes;
  }

  private async extractReactComponents(repoPath: string): Promise<string[]> {
    const components: string[] = [];
    const componentDirs = ["components", "src/components"];

    for (const dir of componentDirs) {
      const fullPath = path.join(repoPath, dir);
      if (await this.directoryExists(fullPath)) {
        const files = await this.scanForFiles(fullPath, /\.(tsx?|jsx?)$/);
        for (const file of files) {
          const componentName = path.basename(file).replace(/\.(tsx?|jsx?)$/, "");
          components.push(componentName);
        }
      }
    }

    return components;
  }

  private async extractPrismaModels(repoPath: string): Promise<string[]> {
    const models: string[] = [];
    const schemaPath = path.join(repoPath, "prisma", "schema.prisma");

    if (await this.fileExists(schemaPath)) {
      const content = await fs.readFile(schemaPath, "utf-8");
      const modelMatches = content.matchAll(/model\s+(\w+)\s*\{/g);
      for (const match of modelMatches) {
        models.push(match[1]);
      }
    }

    return models;
  }

  private async extractDjangoRoutes(repoPath: string): Promise<string[]> {
    const routes: string[] = [];
    const urlFiles = await this.scanForFiles(repoPath, /urls\.py$/);

    for (const file of urlFiles) {
      const content = await fs.readFile(file, "utf-8");
      // Simple pattern matching for Django URL patterns
      const patterns = content.matchAll(/path\(['"](.*?)['"],/g);
      for (const match of patterns) {
        routes.push(`/${match[1]}`);
      }
    }

    return routes;
  }

  private async extractDjangoModels(repoPath: string): Promise<string[]> {
    const models: string[] = [];
    const modelFiles = await this.scanForFiles(repoPath, /models\.py$/);

    for (const file of modelFiles) {
      const content = await fs.readFile(file, "utf-8");
      const modelMatches = content.matchAll(
        /class\s+(\w+)\(models\.Model\)/g
      );
      for (const match of modelMatches) {
        models.push(match[1]);
      }
    }

    return models;
  }

  private async extractRailsRoutes(repoPath: string): Promise<string[]> {
    // Simplified - would need actual Ruby parsing
    return [];
  }

  private async extractRailsModels(repoPath: string): Promise<string[]> {
    const models: string[] = [];
    const modelsDir = path.join(repoPath, "app", "models");

    if (await this.directoryExists(modelsDir)) {
      const files = await this.scanForFiles(modelsDir, /\.rb$/);
      for (const file of files) {
        const modelName = path.basename(file, ".rb");
        models.push(modelName);
      }
    }

    return models;
  }

  private async extractLaravelRoutes(repoPath: string): Promise<string[]> {
    // Simplified - would need actual PHP parsing
    return [];
  }

  private async extractLaravelModels(repoPath: string): Promise<string[]> {
    const models: string[] = [];
    const modelsDir = path.join(repoPath, "app", "Models");

    if (await this.directoryExists(modelsDir)) {
      const files = await this.scanForFiles(modelsDir, /\.php$/);
      for (const file of files) {
        const modelName = path.basename(file, ".php");
        models.push(modelName);
      }
    }

    return models;
  }

  private inferDomains(fileStructure: FileNode): string[] {
    const domains = new Set<string>();

    // Common domain indicators
    const domainKeywords = [
      "auth",
      "user",
      "billing",
      "payment",
      "dashboard",
      "admin",
      "settings",
      "profile",
      "notification",
      "analytics",
      "report",
    ];

    const traverse = (node: FileNode) => {
      const nameLower = node.name.toLowerCase();
      for (const keyword of domainKeywords) {
        if (nameLower.includes(keyword)) {
          domains.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        }
      }

      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(fileStructure);

    return Array.from(domains);
  }

  private async scanForFiles(
    dirPath: string,
    pattern: RegExp
  ): Promise<string[]> {
    const results: string[] = [];

    const scan = async (currentPath: string) => {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          if (this.IGNORE_PATTERNS.includes(entry.name)) continue;

          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile() && pattern.test(entry.name)) {
            results.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    await scan(dirPath);
    return results;
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }
}

export const codeAnalyzer = new CodeAnalyzer();
