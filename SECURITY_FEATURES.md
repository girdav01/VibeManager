# Security Analysis Features

## Overview

VibeManager now includes comprehensive security analysis capabilities that scan your repositories for vulnerabilities, analyze dependencies for supply chain risks, and provide actionable recommendations to mitigate security issues.

## Features

### 🛡️ Automated Security Scanning

When you connect a GitHub repository, VibeManager automatically:
- Scans all dependencies for known vulnerabilities
- Analyzes source code for common security issues
- Evaluates supply chain risks
- Generates a detailed security report with risk scoring

### 🔍 Vulnerability Detection

**Code Security Analysis:**
- ⚠️ **Hardcoded Secrets**: Detects API keys, passwords, tokens in source code
- 💉 **SQL Injection**: Identifies unsafe database queries
- 🔓 **XSS (Cross-Site Scripting)**: Finds DOM manipulation vulnerabilities
- 🔐 **Insecure Cryptography**: Detects weak algorithms (MD5, SHA1, DES)
- 📁 **Path Traversal**: Identifies file access vulnerabilities
- 🧩 **Insecure Deserialization**: Detects unsafe data parsing

**Dependency Vulnerabilities:**
- Scans npm, pip, RubyGems, Composer packages
- Cross-references with CVE databases
- Identifies vulnerable package versions
- Provides upgrade paths to secure versions

**Supply Chain Risks:**
- 🎣 **Typosquatting Detection**: Identifies packages with suspicious names
- 📦 **Deprecated Packages**: Flags unmaintained dependencies
- ⚖️ **License Compliance**: Evaluates license risks
- 🚨 **Suspicious Packages**: Scores packages based on risk indicators

### 📊 Risk Scoring

Each repository receives a **Risk Score (0-100)**:
- **0-24**: Low Risk ✅
- **25-49**: Medium Risk ⚠️
- **50-74**: High Risk 🔴
- **75-100**: Critical Risk ⛔

Scoring considers:
- Number and severity of vulnerabilities
- Deprecated dependencies
- Supply chain risk factors
- License compliance issues

### 🌐 Vulnerability Database Integrations

VibeManager integrates with leading vulnerability databases:

1. **OSV (Open Source Vulnerabilities)**
   - URL: https://osv.dev
   - Coverage: npm, PyPI, RubyGems, Go, Maven, NuGet
   - Real-time vulnerability lookups

2. **NVD (National Vulnerability Database)**
   - URL: https://nvd.nist.gov
   - Maintained by NIST
   - Official MITRE CVE data with CVSS scores

3. **GitHub Advisory Database**
   - URL: https://github.com/advisories
   - Curated security advisories
   - Package-specific fix recommendations

4. **MITRE CVE**
   - Accessed via NVD API
   - Authoritative CVE identifiers
   - Comprehensive vulnerability metadata

### 💡 Smart Recommendations

For each vulnerability, VibeManager provides:
- **Severity Assessment**: CRITICAL, HIGH, MEDIUM, LOW
- **Impact Description**: What the vulnerability allows
- **Mitigation Steps**: Step-by-step remediation guide
- **Effort Estimation**: Time required to fix
- **Priority Ranking**: 1-10 scale
- **Related CVEs**: Links to CVE/NVD details

**Example Recommendations:**

```markdown
🔴 CRITICAL - Remove exposed secrets from codebase
Priority: 10 | Effort: 1-2 hours

Steps:
1. Remove hardcoded credentials from source code
2. Use environment variables for sensitive data
3. Add .env to .gitignore
4. Rotate any exposed credentials immediately
5. Consider using AWS Secrets Manager or HashiCorp Vault
```

## Using Security Features

### Access Security Dashboard

1. Navigate to your project
2. Click on "Security" tab
3. View security overview and scan results

### Run Manual Security Scan

```typescript
// Via UI
Click "Run Security Scan" button in Security Dashboard

// Via API
trpc.security.runSecurityScan.mutate({ repoId: "your-repo-id" })
```

### API Endpoints

All security endpoints are available via tRPC:

```typescript
import { trpc } from "@/lib/trpc/client";

// Get latest security report
const report = await trpc.security.getLatestReport.useQuery({
  repoId: "repo-id"
});

// Get security summary for project
const summary = await trpc.security.getSecuritySummary.useQuery({
  projectId: "project-id"
});

// Mark vulnerability as resolved
await trpc.security.markVulnerabilityResolved.mutate({
  vulnerabilityId: "vuln-id",
  resolved: true
});

// Mark recommendation as implemented
await trpc.security.markRecommendationImplemented.mutate({
  recommendationId: "rec-id",
  implemented: true
});
```

## Security Report Structure

### SecurityReport
- Risk score (0-100)
- Total vulnerabilities by severity
- Scan date and duration
- Git commit SHA
- Status (PENDING, SCANNING, COMPLETED, FAILED)

### Vulnerability
- Type (DEPENDENCY, SQL_INJECTION, XSS, etc.)
- Severity (CRITICAL, HIGH, MEDIUM, LOW)
- Title and description
- File location and line number
- CVE ID and CVSS score
- Package name and version
- Fixed version recommendation
- OWASP category
- CWE (Common Weakness Enumeration) ID

### DependencyRisk
- Package name and version
- Package manager (npm, pip, bundler, composer)
- Deprecated status
- Vulnerability status
- License and license risk
- Suspicious score (0-100)
- Direct vs transitive dependency

### SecurityRecommendation
- Severity and category
- Title and description
- Step-by-step mitigation guide
- Related vulnerability IDs
- Estimated effort
- Priority (1-10)
- Implementation status

## Configuration

### Environment Variables

No additional environment variables required! Security scanning works out of the box.

**Optional API Keys** (for enhanced features):

```bash
# NVD API key for higher rate limits
NVD_API_KEY="your-nvd-api-key"

# GitHub token for private repos
GITHUB_ACCESS_TOKEN="your-github-token"
```

Get NVD API key: https://nvd.nist.gov/developers/request-an-api-key

### Scan Configuration

Control security scanning behavior:

```typescript
// Disable automatic security scanning
await repoIngestionService.ingestRepo(repoId, {
  runSecurityScan: false
});

// Enable security scanning (default)
await repoIngestionService.ingestRepo(repoId, {
  runSecurityScan: true
});
```

## Supported Languages & Package Managers

### JavaScript/TypeScript
- **Package Manager**: npm, yarn, pnpm
- **Files**: package.json, package-lock.json

### Python
- **Package Manager**: pip
- **Files**: requirements.txt, Pipfile

### Ruby
- **Package Manager**: bundler
- **Files**: Gemfile, Gemfile.lock

### PHP
- **Package Manager**: composer
- **Files**: composer.json, composer.lock

### Coming Soon
- Go (go.mod)
- Java (Maven, Gradle)
- Rust (Cargo.toml)
- .NET (NuGet)

## OWASP Top 10 Coverage

VibeManager detects vulnerabilities aligned with **OWASP Top 10 2021**:

1. ✅ **A01: Broken Access Control** - Path traversal detection
2. ✅ **A02: Cryptographic Failures** - Weak crypto detection
3. ✅ **A03: Injection** - SQL injection, XSS detection
4. ⚠️ **A04: Insecure Design** - Manual review recommended
5. ⚠️ **A05: Security Misconfiguration** - Partial detection
6. ✅ **A06: Vulnerable Components** - Dependency scanning
7. ✅ **A07: Authentication Failures** - Hardcoded secrets detection
8. ✅ **A08: Data Integrity Failures** - Deserialization detection
9. ⚠️ **A09: Logging Failures** - Manual review recommended
10. ⚠️ **A10: SSRF** - Partial detection

## Best Practices

### 1. Run Regular Scans
- Scan after every major code change
- Schedule weekly automated scans
- Scan before production deployments

### 2. Prioritize Critical & High Issues
- Address CRITICAL vulnerabilities immediately
- Fix HIGH severity issues within 7 days
- Plan remediation for MEDIUM/LOW issues

### 3. Keep Dependencies Updated
- Update dependencies monthly
- Use lock files (package-lock.json, Pipfile.lock)
- Review changelog before updating

### 4. Never Commit Secrets
- Use environment variables
- Add .env to .gitignore
- Rotate exposed credentials immediately
- Use secrets management tools (AWS Secrets Manager, Vault)

### 5. Review Recommendations
- Read full descriptions
- Follow step-by-step guides
- Test thoroughly after fixing
- Mark as implemented when done

## Performance Considerations

### Scan Duration
- **Small repos** (<1k files): 30-60 seconds
- **Medium repos** (1k-5k files): 1-3 minutes
- **Large repos** (>5k files): 3-5 minutes

### Rate Limits
- **OSV API**: No authentication required, reasonable limits
- **NVD API**: 5 requests/30 seconds (without key), 50/30s (with key)
- **GitHub API**: 60 requests/hour (unauthenticated), 5000/hour (authenticated)

### Optimization Tips
- Scans run asynchronously (non-blocking)
- Results cached per commit SHA
- Re-scans only on new commits

## Troubleshooting

### Scan Failed

**Possible causes:**
- Repository too large (>10k files)
- API rate limit exceeded
- Network connectivity issues

**Solutions:**
- Wait and retry after 1 minute
- Get NVD API key for higher limits
- Check network/firewall settings

### Missing Vulnerabilities

**Why it happens:**
- Vulnerabilities not yet in databases
- Zero-day vulnerabilities
- Language not supported

**What to do:**
- Use additional tools (Snyk, Dependabot)
- Manual code review
- Follow security best practices

### False Positives

**Common scenarios:**
- Test code flagged as vulnerable
- Dev dependencies reported
- Pattern matching limitations

**How to handle:**
- Review and mark as resolved
- Add comments documenting safety
- Use .securityignore (future feature)

## Security & Privacy

### Data Handling
- Repository code analyzed locally (not stored)
- Only metadata sent to vulnerability APIs
- No code uploaded to third-party services
- Scan results stored in your database

### Encryption
- GitHub tokens encrypted at rest
- Database credentials secured
- API calls over HTTPS

### Compliance
- No PII collected during scans
- GDPR compliant
- SOC 2 compatible architecture

## Roadmap

### Coming Soon
- [ ] SAST with Semgrep integration
- [ ] Container/Docker image scanning
- [ ] SBOM generation
- [ ] Automated PRs for dependency updates
- [ ] CI/CD pipeline integration
- [ ] Slack/email notifications
- [ ] Compliance reports (PCI-DSS, HIPAA)

### Under Consideration
- [ ] DAST (Dynamic Application Security Testing)
- [ ] Penetration testing integration
- [ ] Bug bounty program integration
- [ ] Security training recommendations
- [ ] Custom security rules

## Support

For questions or issues:
- GitHub Issues: https://github.com/yourusername/VibeManager/issues
- Documentation: https://docs.vibemanager.com
- Email: security@vibemanager.com

## Learn More

- **OWASP Top 10**: https://owasp.org/Top10/
- **CWE/SANS Top 25**: https://cwe.mitre.org/top25/
- **NVD Database**: https://nvd.nist.gov/
- **OSV.dev**: https://osv.dev/
- **CVSS Scoring**: https://www.first.org/cvss/

---

**Last Updated**: December 2024
**Version**: 1.0.0
