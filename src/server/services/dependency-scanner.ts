import fs from "fs/promises";
import path from "path";
import { SeverityLevel, VulnerabilityType } from "@prisma/client";

interface DependencyVulnerability {
  type: VulnerabilityType;
  severity: SeverityLevel;
  title: string;
  description: string;
  filePath?: string;
  lineNumber?: number;
  codeSnippet?: string;
  cveId?: string;
  cvssScore?: number;
  packageName?: string;
  packageVersion?: string;
  fixedVersion?: string;
  owaspCategory?: string;
  cweId?: string;
}

interface DependencyScanResult {
  vulnerabilities: DependencyVulnerability[];
}

class DependencyScanner {
  async scanDependencies(repoPath: string): Promise<DependencyScanResult> {
    const vulnerabilities: DependencyVulnerability[] = [];

    // Scan npm/yarn dependencies
    const packageJsonPath = path.join(repoPath, "package.json");
    if (await this.fileExists(packageJsonPath)) {
      const npmVulns = await this.scanNpmDependencies(packageJsonPath);
      vulnerabilities.push(...npmVulns);
    }

    // Scan Python dependencies
    const requirementsPath = path.join(repoPath, "requirements.txt");
    if (await this.fileExists(requirementsPath)) {
      const pythonVulns = await this.scanPythonDependencies(requirementsPath);
      vulnerabilities.push(...pythonVulns);
    }

    // Scan Ruby dependencies
    const gemfilePath = path.join(repoPath, "Gemfile");
    if (await this.fileExists(gemfilePath)) {
      const rubyVulns = await this.scanRubyDependencies(gemfilePath);
      vulnerabilities.push(...rubyVulns);
    }

    // Scan PHP dependencies
    const composerPath = path.join(repoPath, "composer.json");
    if (await this.fileExists(composerPath)) {
      const phpVulns = await this.scanPhpDependencies(composerPath);
      vulnerabilities.push(...phpVulns);
    }

    return { vulnerabilities };
  }

  private async scanNpmDependencies(
    packageJsonPath: string
  ): Promise<DependencyVulnerability[]> {
    const vulnerabilities: DependencyVulnerability[] = [];

    try {
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(content);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Known vulnerable packages database (simplified)
      const knownVulnerabilities = this.getKnownNpmVulnerabilities();

      for (const [pkg, version] of Object.entries(allDeps)) {
        const vulns = knownVulnerabilities.get(pkg);
        if (vulns) {
          for (const vuln of vulns) {
            if (this.versionIsVulnerable(version as string, vuln.affectedVersions)) {
              vulnerabilities.push({
                type: VulnerabilityType.DEPENDENCY,
                severity: vuln.severity,
                title: `${pkg}: ${vuln.title}`,
                description: vuln.description,
                packageName: pkg,
                packageVersion: version as string,
                fixedVersion: vuln.fixedVersion,
                cveId: vuln.cveId,
                cvssScore: vuln.cvssScore,
                owaspCategory: vuln.owaspCategory,
                filePath: "package.json",
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error scanning npm dependencies:", error);
    }

    return vulnerabilities;
  }

  private async scanPythonDependencies(
    requirementsPath: string
  ): Promise<DependencyVulnerability[]> {
    const vulnerabilities: DependencyVulnerability[] = [];

    try {
      const content = await fs.readFile(requirementsPath, "utf-8");
      const lines = content.split("\n");

      const knownVulnerabilities = this.getKnownPythonVulnerabilities();

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const match = trimmed.match(/^([a-zA-Z0-9-_]+)([>=<]+)?([\d.]+)?/);
          if (match) {
            const [, pkg, , version] = match;
            const vulns = knownVulnerabilities.get(pkg);

            if (vulns && version) {
              for (const vuln of vulns) {
                if (this.versionIsVulnerable(version, vuln.affectedVersions)) {
                  vulnerabilities.push({
                    type: VulnerabilityType.DEPENDENCY,
                    severity: vuln.severity,
                    title: `${pkg}: ${vuln.title}`,
                    description: vuln.description,
                    packageName: pkg,
                    packageVersion: version,
                    fixedVersion: vuln.fixedVersion,
                    cveId: vuln.cveId,
                    cvssScore: vuln.cvssScore,
                    filePath: "requirements.txt",
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error scanning Python dependencies:", error);
    }

    return vulnerabilities;
  }

  private async scanRubyDependencies(
    gemfilePath: string
  ): Promise<DependencyVulnerability[]> {
    // Simplified Ruby scanning
    return [];
  }

  private async scanPhpDependencies(
    composerPath: string
  ): Promise<DependencyVulnerability[]> {
    // Simplified PHP scanning
    return [];
  }

  private versionIsVulnerable(
    version: string,
    affectedVersions: string
  ): boolean {
    // Simplified version checking
    // In production, use semver library for proper version comparison
    const cleanVersion = version.replace(/[^0-9.]/g, "");
    return affectedVersions.includes(cleanVersion);
  }

  private getKnownNpmVulnerabilities(): Map<string, any[]> {
    // Simplified vulnerability database
    // In production, integrate with npm audit, Snyk, or OSV API
    return new Map([
      [
        "lodash",
        [
          {
            title: "Prototype Pollution",
            description: "Versions of lodash prior to 4.17.21 are vulnerable to prototype pollution",
            severity: SeverityLevel.HIGH,
            affectedVersions: "<4.17.21",
            fixedVersion: "4.17.21",
            cveId: "CVE-2020-8203",
            cvssScore: 7.4,
            owaspCategory: "A06:2021 – Vulnerable and Outdated Components",
          },
        ],
      ],
      [
        "axios",
        [
          {
            title: "SSRF via Proxy",
            description: "Versions before 1.6.0 vulnerable to SSRF",
            severity: SeverityLevel.MEDIUM,
            affectedVersions: "<1.6.0",
            fixedVersion: "1.6.0",
            cveId: "CVE-2023-45857",
            cvssScore: 6.5,
            owaspCategory: "A10:2021 – Server-Side Request Forgery",
          },
        ],
      ],
      [
        "express",
        [
          {
            title: "Open Redirect",
            description: "Express.js versions before 4.19.2 contain an open redirect vulnerability",
            severity: SeverityLevel.MEDIUM,
            affectedVersions: "<4.19.2",
            fixedVersion: "4.19.2",
            cveId: "CVE-2024-29041",
            cvssScore: 6.1,
            owaspCategory: "A01:2021 – Broken Access Control",
          },
        ],
      ],
    ]);
  }

  private getKnownPythonVulnerabilities(): Map<string, any[]> {
    return new Map([
      [
        "django",
        [
          {
            title: "SQL Injection",
            description: "Django versions before 4.2.11 vulnerable to SQL injection",
            severity: SeverityLevel.HIGH,
            affectedVersions: "<4.2.11",
            fixedVersion: "4.2.11",
            cveId: "CVE-2024-27351",
            cvssScore: 8.1,
            owaspCategory: "A03:2021 – Injection",
          },
        ],
      ],
      [
        "flask",
        [
          {
            title: "Session Cookie Security",
            description: "Improper session cookie handling in older versions",
            severity: SeverityLevel.MEDIUM,
            affectedVersions: "<2.3.0",
            fixedVersion: "2.3.0",
            cveId: "CVE-2023-30861",
            cvssScore: 5.9,
            owaspCategory: "A07:2021 – Identification and Authentication Failures",
          },
        ],
      ],
    ]);
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

export const dependencyScanner = new DependencyScanner();
