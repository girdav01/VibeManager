import fs from "fs/promises";
import path from "path";
import { SeverityLevel, VulnerabilityType } from "@prisma/client";

interface CodeVulnerability {
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

class CodeSecurityAnalyzer {
  async analyzeCode(repoPath: string): Promise<CodeVulnerability[]> {
    const vulnerabilities: CodeVulnerability[] = [];

    // Scan for common security issues
    const files = await this.getAllFiles(repoPath);

    for (const file of files) {
      const fileVulns = await this.analyzeFile(file, repoPath);
      vulnerabilities.push(...fileVulns);
    }

    return vulnerabilities;
  }

  private async analyzeFile(
    filePath: string,
    repoPath: string
  ): Promise<CodeVulnerability[]> {
    const vulnerabilities: CodeVulnerability[] = [];

    // Skip non-code files
    if (!this.isCodeFile(filePath)) {
      return vulnerabilities;
    }

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");
      const relativePath = path.relative(repoPath, filePath);

      // Check for secrets/credentials
      const secretsVulns = this.detectSecrets(lines, relativePath);
      vulnerabilities.push(...secretsVulns);

      // Check for SQL injection patterns
      const sqlVulns = this.detectSqlInjection(lines, relativePath);
      vulnerabilities.push(...sqlVulns);

      // Check for XSS vulnerabilities
      const xssVulns = this.detectXSS(lines, relativePath);
      vulnerabilities.push(...xssVulns);

      // Check for insecure crypto
      const cryptoVulns = this.detectInsecureCrypto(lines, relativePath);
      vulnerabilities.push(...cryptoVulns);

      // Check for path traversal
      const pathVulns = this.detectPathTraversal(lines, relativePath);
      vulnerabilities.push(...pathVulns);

      // Check for insecure deserialization
      const deserVulns = this.detectInsecureDeserialization(lines, relativePath);
      vulnerabilities.push(...deserVulns);
    } catch (error) {
      // Skip files that can't be read
    }

    return vulnerabilities;
  }

  private detectSecrets(
    lines: string[],
    filePath: string
  ): CodeVulnerability[] {
    const vulnerabilities: CodeVulnerability[] = [];

    const secretPatterns = [
      {
        pattern: /(?:password|passwd|pwd)\s*=\s*["']([^"']+)["']/i,
        title: "Hardcoded Password",
      },
      {
        pattern: /(?:api[_-]?key|apikey)\s*=\s*["']([^"']+)["']/i,
        title: "Hardcoded API Key",
      },
      {
        pattern: /(?:secret[_-]?key|secretkey)\s*=\s*["']([^"']+)["']/i,
        title: "Hardcoded Secret Key",
      },
      {
        pattern: /(?:access[_-]?token|accesstoken)\s*=\s*["']([^"']+)["']/i,
        title: "Hardcoded Access Token",
      },
      {
        pattern: /(?:private[_-]?key|privatekey)\s*=\s*["']([^"']+)["']/i,
        title: "Hardcoded Private Key",
      },
      {
        pattern: /sk[-_][a-zA-Z0-9]{24,}/,
        title: "Stripe Secret Key",
      },
      {
        pattern: /AKIA[0-9A-Z]{16}/,
        title: "AWS Access Key",
      },
      {
        pattern: /ghp_[a-zA-Z0-9]{36}/,
        title: "GitHub Personal Access Token",
      },
    ];

    lines.forEach((line, index) => {
      for (const { pattern, title } of secretPatterns) {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type: VulnerabilityType.SECRETS_EXPOSURE,
            severity: SeverityLevel.CRITICAL,
            title,
            description: `Found hardcoded credentials in source code. This is a critical security risk as secrets should never be committed to version control.`,
            filePath,
            lineNumber: index + 1,
            codeSnippet: line.trim(),
            owaspCategory: "A07:2021 – Identification and Authentication Failures",
            cweId: "CWE-798",
          });
        }
      }
    });

    return vulnerabilities;
  }

  private detectSqlInjection(
    lines: string[],
    filePath: string
  ): CodeVulnerability[] {
    const vulnerabilities: CodeVulnerability[] = [];

    const sqlPatterns = [
      /execute\([^)]*\+[^)]*\)/i, // String concatenation in SQL
      /query\([^)]*\+[^)]*\)/i,
      /SELECT.*FROM.*WHERE.*\+/i,
      /INSERT.*VALUES.*\+/i,
      /UPDATE.*SET.*\+/i,
      /DELETE.*FROM.*WHERE.*\+/i,
      /db\.run\([^)]*\$\{[^}]+\}/i, // Template literals in SQL
    ];

    lines.forEach((line, index) => {
      for (const pattern of sqlPatterns) {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type: VulnerabilityType.SQL_INJECTION,
            severity: SeverityLevel.HIGH,
            title: "Potential SQL Injection",
            description: `SQL query uses string concatenation or interpolation, which may be vulnerable to SQL injection attacks. Use parameterized queries instead.`,
            filePath,
            lineNumber: index + 1,
            codeSnippet: line.trim(),
            owaspCategory: "A03:2021 – Injection",
            cweId: "CWE-89",
          });
        }
      }
    });

    return vulnerabilities;
  }

  private detectXSS(lines: string[], filePath: string): CodeVulnerability[] {
    const vulnerabilities: CodeVulnerability[] = [];

    const xssPatterns = [
      /dangerouslySetInnerHTML/i,
      /innerHTML\s*=/i,
      /document\.write\(/i,
      /\.html\([^)]*\+/i, // jQuery html() with concatenation
      /eval\(/i,
    ];

    lines.forEach((line, index) => {
      for (const pattern of xssPatterns) {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type: VulnerabilityType.XSS,
            severity: SeverityLevel.HIGH,
            title: "Potential Cross-Site Scripting (XSS)",
            description: `Code uses potentially unsafe DOM manipulation that could lead to XSS attacks. Always sanitize user input before rendering.`,
            filePath,
            lineNumber: index + 1,
            codeSnippet: line.trim(),
            owaspCategory: "A03:2021 – Injection",
            cweId: "CWE-79",
          });
        }
      }
    });

    return vulnerabilities;
  }

  private detectInsecureCrypto(
    lines: string[],
    filePath: string
  ): CodeVulnerability[] {
    const vulnerabilities: CodeVulnerability[] = [];

    const cryptoPatterns = [
      {
        pattern: /createHash\(['"]md5['"]\)/i,
        title: "Weak Hash Algorithm (MD5)",
      },
      {
        pattern: /createHash\(['"]sha1['"]\)/i,
        title: "Weak Hash Algorithm (SHA1)",
      },
      {
        pattern: /createCipher\(['"]des['"]\)/i,
        title: "Weak Encryption Algorithm (DES)",
      },
      { pattern: /Math\.random\(\)/i, title: "Insecure Random Number Generator" },
    ];

    lines.forEach((line, index) => {
      for (const { pattern, title } of cryptoPatterns) {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type: VulnerabilityType.CRYPTOGRAPHY,
            severity: SeverityLevel.MEDIUM,
            title,
            description: `Using weak or outdated cryptographic algorithms. Use modern, secure alternatives like SHA-256 or bcrypt.`,
            filePath,
            lineNumber: index + 1,
            codeSnippet: line.trim(),
            owaspCategory: "A02:2021 – Cryptographic Failures",
            cweId: "CWE-327",
          });
        }
      }
    });

    return vulnerabilities;
  }

  private detectPathTraversal(
    lines: string[],
    filePath: string
  ): CodeVulnerability[] {
    const vulnerabilities: CodeVulnerability[] = [];

    const pathPatterns = [
      /readFile\([^)]*req\.[^)]*\)/i,
      /readFileSync\([^)]*req\.[^)]*\)/i,
      /open\([^)]*request\.[^)]*\)/i,
    ];

    lines.forEach((line, index) => {
      for (const pattern of pathPatterns) {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type: VulnerabilityType.PATH_TRAVERSAL,
            severity: SeverityLevel.HIGH,
            title: "Potential Path Traversal",
            description: `File operations use unsanitized user input, which could allow attackers to access files outside intended directories.`,
            filePath,
            lineNumber: index + 1,
            codeSnippet: line.trim(),
            owaspCategory: "A01:2021 – Broken Access Control",
            cweId: "CWE-22",
          });
        }
      }
    });

    return vulnerabilities;
  }

  private detectInsecureDeserialization(
    lines: string[],
    filePath: string
  ): CodeVulnerability[] {
    const vulnerabilities: CodeVulnerability[] = [];

    const deserPatterns = [
      /JSON\.parse\([^)]*req\.[^)]*\)/i,
      /pickle\.loads\(/i, // Python
      /unserialize\(/i, // PHP
      /yaml\.load\(/i, // Python/JS
    ];

    lines.forEach((line, index) => {
      for (const pattern of deserPatterns) {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type: VulnerabilityType.INSECURE_DESERIALIZATION,
            severity: SeverityLevel.MEDIUM,
            title: "Potential Insecure Deserialization",
            description: `Deserializing untrusted data can lead to remote code execution. Validate and sanitize input before deserialization.`,
            filePath,
            lineNumber: index + 1,
            codeSnippet: line.trim(),
            owaspCategory: "A08:2021 – Software and Data Integrity Failures",
            cweId: "CWE-502",
          });
        }
      }
    });

    return vulnerabilities;
  }

  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    const scan = async (currentPath: string) => {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          // Skip node_modules, .git, etc.
          if (
            entry.name === "node_modules" ||
            entry.name === ".git" ||
            entry.name === "dist" ||
            entry.name === "build"
          ) {
            continue;
          }

          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    await scan(dirPath);
    return files;
  }

  private isCodeFile(filePath: string): boolean {
    const codeExtensions = [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".py",
      ".rb",
      ".php",
      ".java",
      ".go",
      ".rs",
      ".c",
      ".cpp",
      ".cs",
    ];
    return codeExtensions.some((ext) => filePath.endsWith(ext));
  }
}

export const codeSecurityAnalyzer = new CodeSecurityAnalyzer();
