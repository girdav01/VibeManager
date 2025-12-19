import fs from "fs/promises";
import path from "path";
import { SeverityLevel } from "@prisma/client";

interface SupplyChainRisk {
  packageName: string;
  packageVersion: string;
  packageManager: string;
  isDeprecated: boolean;
  hasVulnerabilities: boolean;
  lastUpdateDate?: Date;
  maintainerCount?: number;
  downloadCount?: number;
  license?: string;
  licenseRisk: SeverityLevel;
  directDependency: boolean;
  dependencyDepth: number;
  suspiciousScore: number;
  riskLevel: SeverityLevel;
}

class SupplyChainAnalyzer {
  async analyzeSupplyChain(repoPath: string): Promise<SupplyChainRisk[]> {
    const risks: SupplyChainRisk[] = [];

    // Analyze npm packages
    const packageJsonPath = path.join(repoPath, "package.json");
    if (await this.fileExists(packageJsonPath)) {
      const npmRisks = await this.analyzeNpmPackages(packageJsonPath);
      risks.push(...npmRisks);
    }

    // Analyze Python packages
    const requirementsPath = path.join(repoPath, "requirements.txt");
    if (await this.fileExists(requirementsPath)) {
      const pythonRisks = await this.analyzePythonPackages(requirementsPath);
      risks.push(...pythonRisks);
    }

    return risks;
  }

  private async analyzeNpmPackages(
    packageJsonPath: string
  ): Promise<SupplyChainRisk[]> {
    const risks: SupplyChainRisk[] = [];

    try {
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(content);

      // Analyze direct dependencies
      if (packageJson.dependencies) {
        for (const [pkg, version] of Object.entries(
          packageJson.dependencies
        )) {
          const risk = await this.analyzePackage(
            pkg,
            version as string,
            "npm",
            true
          );
          risks.push(risk);
        }
      }

      // Analyze dev dependencies
      if (packageJson.devDependencies) {
        for (const [pkg, version] of Object.entries(
          packageJson.devDependencies
        )) {
          const risk = await this.analyzePackage(
            pkg,
            version as string,
            "npm",
            true
          );
          risks.push(risk);
        }
      }
    } catch (error) {
      console.error("Error analyzing npm packages:", error);
    }

    return risks;
  }

  private async analyzePythonPackages(
    requirementsPath: string
  ): Promise<SupplyChainRisk[]> {
    const risks: SupplyChainRisk[] = [];

    try {
      const content = await fs.readFile(requirementsPath, "utf-8");
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const match = trimmed.match(/^([a-zA-Z0-9-_]+)([>=<]+)?([\d.]+)?/);
          if (match) {
            const [, pkg, , version] = match;
            const risk = await this.analyzePackage(
              pkg,
              version || "latest",
              "pip",
              true
            );
            risks.push(risk);
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing Python packages:", error);
    }

    return risks;
  }

  private async analyzePackage(
    packageName: string,
    version: string,
    packageManager: string,
    directDependency: boolean
  ): Promise<SupplyChainRisk> {
    // Check for known risky patterns
    const suspiciousScore = this.calculateSuspiciousScore(packageName);

    // Check for deprecated packages
    const isDeprecated = this.isDeprecatedPackage(packageName, packageManager);

    // Check license risk
    const license = await this.getPackageLicense(packageName, packageManager);
    const licenseRisk = this.assessLicenseRisk(license);

    // Determine overall risk level
    let riskLevel = SeverityLevel.LOW;

    if (suspiciousScore > 70) {
      riskLevel = SeverityLevel.HIGH;
    } else if (isDeprecated) {
      riskLevel = SeverityLevel.MEDIUM;
    } else if (licenseRisk === SeverityLevel.HIGH) {
      riskLevel = SeverityLevel.MEDIUM;
    }

    return {
      packageName,
      packageVersion: version,
      packageManager,
      isDeprecated,
      hasVulnerabilities: false, // This is set by dependency scanner
      license,
      licenseRisk,
      directDependency,
      dependencyDepth: directDependency ? 0 : 1,
      suspiciousScore,
      riskLevel,
    };
  }

  private calculateSuspiciousScore(packageName: string): number {
    let score = 0;

    // Check for typosquatting patterns
    const popularPackages = [
      "react",
      "vue",
      "angular",
      "express",
      "lodash",
      "axios",
      "webpack",
      "babel",
      "eslint",
      "typescript",
    ];

    for (const popular of popularPackages) {
      const distance = this.levenshteinDistance(packageName, popular);
      if (distance === 1) {
        score += 50; // Very close to popular package name
      } else if (distance === 2) {
        score += 30;
      }
    }

    // Check for suspicious patterns in name
    if (packageName.includes("test") && packageName.length < 8) {
      score += 20; // Suspiciously short test package
    }

    if (/[0-9]{3,}/.test(packageName)) {
      score += 15; // Many numbers in name
    }

    if (packageName.length < 3) {
      score += 10; // Very short name
    }

    // Check for common malicious patterns
    const maliciousPatterns = [
      /^lib[a-z]{1,3}$/i,
      /^utils?[0-9]$/i,
      /^core[0-9]$/i,
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(packageName)) {
        score += 25;
      }
    }

    return Math.min(score, 100);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private isDeprecatedPackage(
    packageName: string,
    packageManager: string
  ): boolean {
    // Simplified - would integrate with registry APIs
    const deprecatedPackages = new Set([
      "request",
      "node-uuid",
      "gulp-util",
      "natives",
    ]);

    return deprecatedPackages.has(packageName);
  }

  private async getPackageLicense(
    packageName: string,
    packageManager: string
  ): Promise<string | undefined> {
    // Simplified - would call package registry API
    // For now, return undefined
    return undefined;
  }

  private assessLicenseRisk(license?: string): SeverityLevel {
    if (!license) return SeverityLevel.LOW;

    const riskyLicenses = ["GPL-3.0", "AGPL-3.0", "SSPL"];
    const moderateRiskLicenses = ["GPL-2.0", "LGPL-3.0"];

    if (riskyLicenses.includes(license)) {
      return SeverityLevel.HIGH;
    } else if (moderateRiskLicenses.includes(license)) {
      return SeverityLevel.MEDIUM;
    }

    return SeverityLevel.LOW;
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

export const supplyChainAnalyzer = new SupplyChainAnalyzer();
