---
name: security-architecture
description: Enterprise-grade security architecture and cybersecurity audit skill. Applies OWASP Top 10, Zero Trust principles, RGPD compliance, secure headers, and automated vulnerability scanning to web applications.
---

# 🛡️ Security Architecture Skill

When activated, systematically audit the application's security posture and apply enterprise-grade hardening. This skill follows the defense-in-depth principle: multiple layers of security controls.

---

## Step 1: Threat Model (STRIDE)

Before auditing, identify the threat landscape:

| Threat | Question | Applies? |
|:-------|:---------|:---------|
| **S**poofing | Can someone impersonate a user or system? | |
| **T**ampering | Can someone modify data in transit or at rest? | |
| **R**epudiation | Can actions be denied without proof? | |
| **I**nformation Disclosure | Can sensitive data leak? | |
| **D**enial of Service | Can the service be overwhelmed? | |
| **E**levation of Privilege | Can someone gain unauthorized access? | |

For **DéménageFacile** (client-side SPA):
- ✅ Low risk: no server, no auth, no database
- ⚠️ Medium risk: CDN dependencies (supply chain), user data in browser
- 🔒 Key focus: XSS prevention, CSP headers, dependency integrity, RGPD

---

## Step 2: OWASP Top 10 Audit

### A01:2021 — Broken Access Control
**Check:**
- [ ] No admin routes exposed in client-side code
- [ ] No sensitive logic gated only by client-side checks
- [ ] Server-side authorization enforced (if backend exists)
- [ ] Directory listing disabled on web server

**Fix pattern:**
```javascript
// ❌ BAD: Client-side role check only
if (user.role === 'admin') showAdminPanel();

// ✅ GOOD: Server validates every request
fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` }});
```

### A02:2021 — Cryptographic Failures
**Check:**
- [ ] No sensitive data in localStorage (passwords, tokens, PII)
- [ ] If storing data locally, use encryption (Web Crypto API)
- [ ] All external resources loaded over HTTPS
- [ ] No hardcoded secrets/API keys in source code

**Scan command:**
```bash
# Search for potential secrets in codebase
grep -rn --include="*.js" --include="*.ts" --include="*.env" \
  -E "(password|secret|api[_-]?key|token|private[_-]?key)" . \
  | grep -v node_modules | grep -v ".git"
```

### A03:2021 — Injection (XSS Focus)
**Check:**
- [ ] No `innerHTML` with unsanitized user input
- [ ] No `eval()`, `Function()`, or `document.write()` with dynamic data
- [ ] No `v-html` or `dangerouslySetInnerHTML` with user data
- [ ] All user output properly escaped

**Fix pattern:**
```javascript
// ❌ BAD: Direct innerHTML injection
element.innerHTML = userInput;

// ✅ GOOD: Use textContent or escape
element.textContent = userInput;

// ✅ GOOD: Escape function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### A04:2021 — Insecure Design
**Check:**
- [ ] Rate limiting on API endpoints (if backend)
- [ ] Input validation (length, type, format) on both client and server
- [ ] Error messages don't reveal internal architecture
- [ ] No debug information exposed in production

### A05:2021 — Security Misconfiguration
**Check:**
- [ ] Security HTTP headers configured (see Step 3 below)
- [ ] Default credentials removed
- [ ] Error pages don't expose stack traces
- [ ] Unnecessary HTTP methods disabled (PUT, DELETE, TRACE)
- [ ] CORS policy is restrictive (not `*`)

### A06:2021 — Vulnerable Components
**Check:**
- [ ] All dependencies up-to-date
- [ ] No known CVEs in dependencies
- [ ] CDN resources use SRI (Subresource Integrity)

**Scan commands:**
```bash
# npm audit
npm audit --production

# Check for outdated packages
npm outdated

# SRI hash generation for CDN scripts
echo -n "$(curl -s https://cdn-url/script.js)" | openssl dgst -sha384 -binary | openssl base64 -A
```

**SRI Fix example:**
```html
<!-- ❌ BAD: No integrity check -->
<script src="https://cdn.example.com/lib.js"></script>

<!-- ✅ GOOD: SRI integrity attribute -->
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-HASH_HERE"
        crossorigin="anonymous"></script>
```

### A07:2021 — Authentication Failures
**Check (if applicable):**
- [ ] Passwords hashed with bcrypt/argon2 (never MD5/SHA1)
- [ ] Multi-factor authentication available
- [ ] Session tokens are cryptographically random
- [ ] Session timeout implemented
- [ ] Brute-force protection (account lockout / rate limit)

### A08:2021 — Software and Data Integrity
**Check:**
- [ ] CI/CD pipeline uses signed commits
- [ ] Build artifacts are verified
- [ ] CDN dependencies use SRI (see A06)
- [ ] No auto-update mechanisms without user consent

### A09:2021 — Logging & Monitoring
**Check:**
- [ ] Authentication events are logged (login, logout, failures)
- [ ] Errors are logged (without sensitive data)
- [ ] Logs are stored securely (not accessible publicly)
- [ ] Alerting configured for suspicious patterns

### A10:2021 — Server-Side Request Forgery (SSRF)
**Check:**
- [ ] No user-controlled URLs passed to server-side HTTP clients
- [ ] URL allowlists for any server-side fetch operations
- [ ] Internal services not accessible from user-facing endpoints

---

## Step 3: HTTP Security Headers

Apply these headers on your web server or CDN:

### Critical (Must-Have)
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

### Recommended
```
X-XSS-Protection: 0
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

### Vercel / Netlify Configuration

**Vercel (`vercel.json`):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

**Netlify (`netlify.toml`):**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

---

## Step 4: Data Protection & RGPD Compliance

### For Client-Side Apps (No Backend)
- [ ] Privacy banner / cookie consent implemented
- [ ] Privacy policy page/link accessible
- [ ] No data sent to external servers without consent
- [ ] No tracking scripts without consent (GA, Facebook Pixel, etc.)
- [ ] `localStorage` / `sessionStorage` usage documented
- [ ] Clear mechanism for user to delete their local data

### For Apps with Backend
- [ ] Data minimization: collect only necessary data
- [ ] Purpose limitation: use data only for stated purpose
- [ ] Consent mechanism: explicit opt-in for data collection
- [ ] Right to access: users can request their data (DSAR)
- [ ] Right to deletion: users can request data deletion
- [ ] Data breach notification process defined
- [ ] Data processing agreement (DPA) with third parties
- [ ] Data retention policy defined and implemented

### Data Classification
| Level | Type | Storage | Encryption |
|:------|:-----|:--------|:-----------|
| 🔴 Critical | Passwords, payment data | Server-side only, encrypted | AES-256 / bcrypt |
| 🟠 Sensitive | Email, phone, address | Encrypted at rest | AES-256 |
| 🟡 Internal | Preferences, settings | localStorage OK | Optional |
| 🟢 Public | Marketing content | Anywhere | Not needed |

---

## Step 5: Supply Chain Security

### CDN Dependencies
For every external script/stylesheet:
1. **Pin the version** (never use `@latest`)
2. **Add SRI hash** (integrity attribute)
3. **Add `crossorigin="anonymous"`**
4. **Consider self-hosting** critical dependencies

### npm Dependencies
```bash
# Full audit
npm audit --production --audit-level=moderate

# Check for known vulnerabilities
npx -y better-npm-audit audit --production

# Verify package provenance
npm pack --dry-run  # Check what gets published
```

### Git Security
- [ ] `.gitignore` includes `.env`, `*.key`, `*.pem`, `node_modules`
- [ ] No secrets in git history (use `git-secrets` or `trufflehog`)
- [ ] Signed commits enabled
- [ ] Branch protection rules on main branch

---

## Step 6: Security Audit Report

Generate a report using this format:

```
╔══════════════════════════════════════════════════╗
║          🛡️ SECURITY AUDIT REPORT                ║
╠══════════════════════════════════════════════════╣
║ Application: [App Name]                          ║
║ Date:        [YYYY-MM-DD]                        ║
║ Auditor:     Antigravity Agent                   ║
║ Risk Level:  [🟢 LOW / 🟡 MEDIUM / 🔴 HIGH]     ║
╠══════════════════════════════════════════════════╣
║ OWASP Coverage:     [X/10] categories audited    ║
║ Headers Score:      [X/8] configured              ║
║ RGPD Compliance:    [✅/⚠️/❌]                   ║
║ Supply Chain:       [✅/⚠️/❌]                   ║
║ Data Protection:    [✅/⚠️/❌]                   ║
╠══════════════════════════════════════════════════╣
║ 🔴 Critical:  [count] findings                   ║
║ 🟠 High:      [count] findings                   ║
║ 🟡 Medium:    [count] findings                   ║
║ 🟢 Low:       [count] findings                   ║
║ ℹ️  Info:      [count] findings                   ║
╚══════════════════════════════════════════════════╝
```

List all findings with:
- **ID**: SEC-001, SEC-002, etc.
- **Severity**: Critical / High / Medium / Low / Info
- **Category**: OWASP category
- **Description**: What was found
- **Location**: File and line number
- **Recommendation**: How to fix
- **Status**: Open / Fixed / Accepted Risk
