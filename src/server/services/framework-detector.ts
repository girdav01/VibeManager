import fs from "fs/promises";
import path from "path";

interface FrameworkInfo {
  framework: string;
  language: string;
  packageManager: string;
  version?: string;
}

class FrameworkDetector {
  async detect(repoPath: string): Promise<FrameworkInfo> {
    // Check for package.json (Node.js/JavaScript/TypeScript)
    const packageJsonPath = path.join(repoPath, "package.json");
    const hasPackageJson = await this.fileExists(packageJsonPath);

    if (hasPackageJson) {
      return this.detectJavaScriptFramework(packageJsonPath);
    }

    // Check for Python
    const requirementsPath = path.join(repoPath, "requirements.txt");
    const pyprojectPath = path.join(repoPath, "pyproject.toml");
    if (
      (await this.fileExists(requirementsPath)) ||
      (await this.fileExists(pyprojectPath))
    ) {
      return this.detectPythonFramework(repoPath);
    }

    // Check for Ruby
    const gemfilePath = path.join(repoPath, "Gemfile");
    if (await this.fileExists(gemfilePath)) {
      return this.detectRubyFramework(gemfilePath);
    }

    // Check for PHP
    const composerPath = path.join(repoPath, "composer.json");
    if (await this.fileExists(composerPath)) {
      return this.detectPHPFramework(composerPath);
    }

    // Default/Unknown
    return {
      framework: "Unknown",
      language: "Unknown",
      packageManager: "Unknown",
    };
  }

  private async detectJavaScriptFramework(
    packageJsonPath: string
  ): Promise<FrameworkInfo> {
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    let framework = "Node.js";
    let packageManager = "npm";

    // Detect framework
    if (deps.next) {
      framework = "Next.js";
    } else if (deps.react && deps["react-scripts"]) {
      framework = "Create React App";
    } else if (deps.vue) {
      framework = "Vue.js";
    } else if (deps.angular || deps["@angular/core"]) {
      framework = "Angular";
    } else if (deps.svelte) {
      framework = "Svelte";
    } else if (deps.express) {
      framework = "Express.js";
    } else if (deps.nestjs || deps["@nestjs/core"]) {
      framework = "NestJS";
    } else if (deps.remix || deps["@remix-run/react"]) {
      framework = "Remix";
    }

    // Detect package manager
    const yarnLockExists = await this.fileExists(
      path.join(path.dirname(packageJsonPath), "yarn.lock")
    );
    const pnpmLockExists = await this.fileExists(
      path.join(path.dirname(packageJsonPath), "pnpm-lock.yaml")
    );

    if (yarnLockExists) packageManager = "yarn";
    else if (pnpmLockExists) packageManager = "pnpm";

    const language = deps.typescript ? "TypeScript" : "JavaScript";

    return {
      framework,
      language,
      packageManager,
      version: deps[framework.toLowerCase()],
    };
  }

  private async detectPythonFramework(
    repoPath: string
  ): Promise<FrameworkInfo> {
    const requirementsPath = path.join(repoPath, "requirements.txt");
    let framework = "Python";

    if (await this.fileExists(requirementsPath)) {
      const content = await fs.readFile(requirementsPath, "utf-8");

      if (content.includes("django")) framework = "Django";
      else if (content.includes("flask")) framework = "Flask";
      else if (content.includes("fastapi")) framework = "FastAPI";
    }

    return {
      framework,
      language: "Python",
      packageManager: "pip",
    };
  }

  private async detectRubyFramework(gemfilePath: string): Promise<FrameworkInfo> {
    const content = await fs.readFile(gemfilePath, "utf-8");
    const framework = content.includes("rails") ? "Ruby on Rails" : "Ruby";

    return {
      framework,
      language: "Ruby",
      packageManager: "bundler",
    };
  }

  private async detectPHPFramework(
    composerPath: string
  ): Promise<FrameworkInfo> {
    const content = await fs.readFile(composerPath, "utf-8");
    const composer = JSON.parse(content);
    const deps = { ...composer.require, ...composer["require-dev"] };

    let framework = "PHP";

    if (deps["laravel/framework"]) framework = "Laravel";
    else if (deps["symfony/symfony"]) framework = "Symfony";

    return {
      framework,
      language: "PHP",
      packageManager: "composer",
    };
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const frameworkDetector = new FrameworkDetector();
