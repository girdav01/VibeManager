import fs from "fs/promises";
import path from "path";
import { db } from "@/server/db";
import { SeverityLevel, VulnerabilityType, SecurityStatus } from "@prisma/client";
import { dependencyScanner } from "./dependency-scanner";
import { codeSecurityAnalyzer } from "./code-security-analyzer";
import { supplyChainAnalyzer } from "./supply-chain-analyzer";

interface SecurityScanResult {
  reportId: string;
  riskScore: number;
  summary: {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

class SecurityAnalysisService {
  async analyzeSecurity(
    repoId: string,
    repoPath: string,
    commitSha: string
  ): Promise<SecurityScanResult> {
    const startTime = Date.now();

    try {
      // Create security report
      const report = await db.securityReport.create({
        data: {
          repoId,
          commitSha,
          status: SecurityStatus.SCANNING,
        },
      });

      // Run parallel security scans
      const [dependencies, codeIssues, supplyChainRisks] = await Promise.all([
        dependencyScanner.scanDependencies(repoPath),
        codeSecurityAnalyzer.analyzeCode(repoPath),
        supplyChainAnalyzer.analyzeSupplyChain(repoPath),
      ]);

      // Create vulnerabilities
      const vulnerabilities = [...dependencies.vulnerabilities, ...codeIssues];

      for (const vuln of vulnerabilities) {
        await db.vulnerability.create({
          data: {
            securityReportId: report.id,
            type: vuln.type,
            severity: vuln.severity,
            title: vuln.title,
            description: vuln.description,
            filePath: vuln.filePath,
            lineNumber: vuln.lineNumber,
            codeSnippet: vuln.codeSnippet,
            cveId: vuln.cveId,
            cvssScore: vuln.cvssScore,
            packageName: vuln.packageName,
            packageVersion: vuln.packageVersion,
            fixedVersion: vuln.fixedVersion,
            owaspCategory: vuln.owaspCategory,
            cweId: vuln.cweId,
          },
        });
      }

      // Create dependency risks
      for (const risk of supplyChainRisks) {
        await db.dependencyRisk.create({
          data: {
            securityReportId: report.id,
            packageName: risk.packageName,
            packageVersion: risk.packageVersion,
            packageManager: risk.packageManager,
            isDeprecated: risk.isDeprecated,
            hasVulnerabilities: risk.hasVulnerabilities,
            lastUpdateDate: risk.lastUpdateDate,
            maintainerCount: risk.maintainerCount,
            downloadCount: risk.downloadCount,
            license: risk.license,
            licenseRisk: risk.licenseRisk,
            directDependency: risk.directDependency,
            dependencyDepth: risk.dependencyDepth,
            suspiciousScore: risk.suspiciousScore,
            riskLevel: risk.riskLevel,
          },
        });
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        vulnerabilities,
        supplyChainRisks
      );

      for (const rec of recommendations) {
        await db.securityRecommendation.create({
          data: {
            securityReportId: report.id,
            severity: rec.severity,
            category: rec.category,
            title: rec.title,
            description: rec.description,
            steps: rec.steps,
            relatedVulnerabilityIds: rec.relatedVulnerabilityIds,
            estimatedEffort: rec.estimatedEffort,
            priority: rec.priority,
          },
        });
      }

      // Calculate summary and risk score
      const summary = this.calculateSummary(vulnerabilities);
      const riskScore = this.calculateRiskScore(
        vulnerabilities,
        supplyChainRisks
      );

      const scanDuration = Date.now() - startTime;

      // Update report
      await db.securityReport.update({
        where: { id: report.id },
        data: {
          status: SecurityStatus.COMPLETED,
          totalVulnerabilities: summary.totalVulnerabilities,
          criticalCount: summary.criticalCount,
          highCount: summary.highCount,
          mediumCount: summary.mediumCount,
          lowCount: summary.lowCount,
          riskScore,
          scanDuration,
        },
      });

      return {
        reportId: report.id,
        riskScore,
        summary,
      };
    } catch (error) {
      console.error("Security analysis failed:", error);
      throw error;
    }
  }

  private calculateSummary(vulnerabilities: any[]) {
    const summary = {
      totalVulnerabilities: vulnerabilities.length,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };

    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case SeverityLevel.CRITICAL:
          summary.criticalCount++;
          break;
        case SeverityLevel.HIGH:
          summary.highCount++;
          break;
        case SeverityLevel.MEDIUM:
          summary.mediumCount++;
          break;
        case SeverityLevel.LOW:
        case SeverityLevel.INFO:
          summary.lowCount++;
          break;
      }
    }

    return summary;
  }

  private calculateRiskScore(
    vulnerabilities: any[],
    supplyChainRisks: any[]
  ): number {
    let score = 0;

    // Vulnerability scoring
    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case SeverityLevel.CRITICAL:
          score += 10;
          break;
        case SeverityLevel.HIGH:
          score += 5;
          break;
        case SeverityLevel.MEDIUM:
          score += 2;
          break;
        case SeverityLevel.LOW:
          score += 1;
          break;
      }
    }

    // Supply chain risk scoring
    for (const risk of supplyChainRisks) {
      if (risk.isDeprecated) score += 3;
      if (risk.hasVulnerabilities) score += 5;
      if (risk.suspiciousScore > 50) score += 5;
      if (risk.licenseRisk === SeverityLevel.HIGH) score += 2;
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  private generateRecommendations(
    vulnerabilities: any[],
    supplyChainRisks: any[]
  ) {
    const recommendations: any[] = [];

    // Group vulnerabilities by type for recommendations
    const vulnsByType = new Map<string, any[]>();
    for (const vuln of vulnerabilities) {
      const key = `${vuln.type}-${vuln.packageName || "code"}`;
      if (!vulnsByType.has(key)) {
        vulnsByType.set(key, []);
      }
      vulnsByType.get(key)!.push(vuln);
    }

    // Generate dependency update recommendations
    for (const [key, vulns] of vulnsByType) {
      if (vulns[0].type === VulnerabilityType.DEPENDENCY && vulns[0].fixedVersion) {
        recommendations.push({
          severity: vulns[0].severity,
          category: "Dependency Update",
          title: `Update ${vulns[0].packageName} to fix ${vulns.length} vulnerability(ies)`,
          description: `The package ${vulns[0].packageName}@${vulns[0].packageVersion} has ${vulns.length} known security vulnerability(ies). Update to version ${vulns[0].fixedVersion} or later to fix these issues.`,
          steps: [
            `Update package.json or requirements.txt to use ${vulns[0].packageName}@${vulns[0].fixedVersion}`,
            "Run your package manager's update command",
            "Test your application thoroughly after the update",
            "Commit the updated dependency files",
          ],
          relatedVulnerabilityIds: vulns.map((v) => v.id),
          estimatedEffort: "15-30 minutes",
          priority: this.getPriorityFromSeverity(vulns[0].severity),
        });
      }
    }

    // Code security recommendations
    const secretsExposure = vulnerabilities.filter(
      (v) => v.type === VulnerabilityType.SECRETS_EXPOSURE
    );
    if (secretsExposure.length > 0) {
      recommendations.push({
        severity: SeverityLevel.CRITICAL,
        category: "Security Configuration",
        title: "Remove exposed secrets from codebase",
        description: `Found ${secretsExposure.length} potential secrets or credentials in your code. These should be moved to environment variables.`,
        steps: [
          "Remove hardcoded credentials from source code",
          "Use environment variables for sensitive data",
          "Add .env to .gitignore",
          "Rotate any exposed credentials immediately",
          "Consider using a secrets management service (AWS Secrets Manager, HashiCorp Vault)",
        ],
        relatedVulnerabilityIds: secretsExposure.map((v) => v.id),
        estimatedEffort: "1-2 hours",
        priority: 10,
      });
    }

    // SQL injection recommendations
    const sqlInjection = vulnerabilities.filter(
      (v) => v.type === VulnerabilityType.SQL_INJECTION
    );
    if (sqlInjection.length > 0) {
      recommendations.push({
        severity: SeverityLevel.HIGH,
        category: "Code Fix",
        title: "Fix SQL injection vulnerabilities",
        description: `Found ${sqlInjection.length} potential SQL injection vulnerability(ies). Use parameterized queries or ORM instead of string concatenation.`,
        steps: [
          "Replace string concatenation with parameterized queries",
          "Use prepared statements",
          "Consider using an ORM (Prisma, TypeORM, SQLAlchemy)",
          "Validate and sanitize all user inputs",
          "Implement input validation middleware",
        ],
        relatedVulnerabilityIds: sqlInjection.map((v) => v.id),
        estimatedEffort: "2-4 hours",
        priority: 9,
      });
    }

    // XSS recommendations
    const xss = vulnerabilities.filter((v) => v.type === VulnerabilityType.XSS);
    if (xss.length > 0) {
      recommendations.push({
        severity: SeverityLevel.HIGH,
        category: "Code Fix",
        title: "Fix Cross-Site Scripting (XSS) vulnerabilities",
        description: `Found ${xss.length} potential XSS vulnerability(ies). Always sanitize user input before rendering.`,
        steps: [
          "Use framework-provided escaping (React automatically escapes)",
          "Avoid dangerouslySetInnerHTML unless absolutely necessary",
          "Implement Content Security Policy (CSP) headers",
          "Sanitize user input on both client and server",
          "Use DOMPurify for sanitizing HTML if needed",
        ],
        relatedVulnerabilityIds: xss.map((v) => v.id),
        estimatedEffort: "1-3 hours",
        priority: 8,
      });
    }

    // Deprecated dependencies recommendations
    const deprecatedDeps = supplyChainRisks.filter((r) => r.isDeprecated);
    if (deprecatedDeps.length > 0) {
      recommendations.push({
        severity: SeverityLevel.MEDIUM,
        category: "Dependency Maintenance",
        title: `Replace ${deprecatedDeps.length} deprecated dependencies`,
        description: "Using deprecated packages can lead to security issues and lack of support.",
        steps: [
          "Review deprecated packages and find maintained alternatives",
          "Update code to use the new packages",
          "Test thoroughly after migration",
          "Keep dependencies up to date regularly",
        ],
        relatedVulnerabilityIds: [],
        estimatedEffort: "4-8 hours",
        priority: 5,
      });
    }

    // Supply chain suspicious packages
    const suspiciousPackages = supplyChainRisks.filter(
      (r) => r.suspiciousScore > 70
    );
    if (suspiciousPackages.length > 0) {
      recommendations.push({
        severity: SeverityLevel.HIGH,
        category: "Supply Chain Security",
        title: `Review ${suspiciousPackages.length} suspicious package(s)`,
        description: "Some packages show characteristics that may indicate security risks (typosquatting, low maintenance, etc.)",
        steps: [
          "Verify package names are correct (check for typosquatting)",
          "Review package maintainers and reputation",
          "Check package source code if possible",
          "Consider finding alternative packages with better reputation",
          "Use lock files to prevent unexpected updates",
        ],
        relatedVulnerabilityIds: [],
        estimatedEffort: "1-2 hours",
        priority: 7,
      });
    }

    return recommendations;
  }

  private getPriorityFromSeverity(severity: SeverityLevel): number {
    switch (severity) {
      case SeverityLevel.CRITICAL:
        return 10;
      case SeverityLevel.HIGH:
        return 8;
      case SeverityLevel.MEDIUM:
        return 5;
      case SeverityLevel.LOW:
        return 3;
      default:
        return 1;
    }
  }
}

export const securityAnalysisService = new SecurityAnalysisService();
