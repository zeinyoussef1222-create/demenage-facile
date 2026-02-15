#!/usr/bin/env bash
# ============================================================
# Security Architecture — Automated Security Audit Script
# Scans the codebase for common security vulnerabilities
# Usage: bash security-audit.sh [PROJECT_DIR]
# ============================================================

set -euo pipefail

PROJECT_DIR="${1:-.}"
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0
INFO=0

RED='\033[0;31m'
ORANGE='\033[0;33m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

finding_critical() { echo -e "${RED}🔴 CRITICAL${NC}: $1"; ((CRITICAL++)); }
finding_high()     { echo -e "${ORANGE}🟠 HIGH${NC}:     $1"; ((HIGH++)); }
finding_medium()   { echo -e "${YELLOW}🟡 MEDIUM${NC}:   $1"; ((MEDIUM++)); }
finding_low()      { echo -e "${GREEN}🟢 LOW${NC}:      $1"; ((LOW++)); }
finding_info()     { echo -e "${CYAN}ℹ️  INFO${NC}:     $1"; ((INFO++)); }
section()          { echo -e "\n${CYAN}═══ $1 ═══${NC}"; }

echo "╔══════════════════════════════════════════════════╗"
echo "║     🛡️ Security Architecture Audit               ║"
echo "║     Target: $PROJECT_DIR"
echo "║     Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "╚══════════════════════════════════════════════════╝"

# ── A03: Injection / XSS ────────────────────────────────────
section "A03: INJECTION / XSS"

# innerHTML with variables (not static)
INNER_HTML=$(grep -rn --include="*.js" --include="*.ts" --include="*.html" \
  "\.innerHTML\s*=" "$PROJECT_DIR" 2>/dev/null \
  | grep -v node_modules | grep -v ".git" || true)

if [ -n "$INNER_HTML" ]; then
    COUNT=$(echo "$INNER_HTML" | wc -l)
    finding_medium "Found $COUNT innerHTML assignments — verify no unsanitized user input"
    echo "$INNER_HTML" | head -5 | while IFS= read -r line; do
        echo "    → $line"
    done
else
    finding_info "No innerHTML assignments found"
fi

# eval / Function usage
EVAL_USAGE=$(grep -rn --include="*.js" --include="*.ts" \
  -E "(eval\(|new Function\(|setTimeout\(['\"]|setInterval\(['\"])" "$PROJECT_DIR" 2>/dev/null \
  | grep -v node_modules | grep -v ".git" || true)

if [ -n "$EVAL_USAGE" ]; then
    finding_high "Dangerous eval/Function usage found"
    echo "$EVAL_USAGE" | while IFS= read -r line; do
        echo "    → $line"
    done
else
    finding_info "No eval/Function usage found ✓"
fi

# document.write
DOC_WRITE=$(grep -rn --include="*.js" --include="*.html" \
  "document\.write" "$PROJECT_DIR" 2>/dev/null \
  | grep -v node_modules | grep -v ".git" || true)

if [ -n "$DOC_WRITE" ]; then
    finding_medium "document.write found — potential XSS vector"
else
    finding_info "No document.write found ✓"
fi

# ── A02: Cryptographic Failures / Secrets ────────────────────
section "A02: CRYPTOGRAPHIC FAILURES"

# Hardcoded secrets
SECRETS=$(grep -rn --include="*.js" --include="*.ts" --include="*.py" --include="*.env" \
  -iE "(password|secret|api[_-]?key|private[_-]?key|access[_-]?token)\s*[:=]" "$PROJECT_DIR" 2>/dev/null \
  | grep -v node_modules | grep -v ".git" | grep -v "placeholder" | grep -v "example" || true)

if [ -n "$SECRETS" ]; then
    finding_critical "Potential hardcoded secrets found!"
    echo "$SECRETS" | while IFS= read -r line; do
        echo "    → $line"
    done
else
    finding_info "No hardcoded secrets detected ✓"
fi

# HTTP URLs (mixed content)
HTTP_URLS=$(grep -rn --include="*.js" --include="*.html" --include="*.css" \
  -E "http://" "$PROJECT_DIR" 2>/dev/null \
  | grep -v "localhost" | grep -v "127.0.0.1" | grep -v "http://" \
  | grep -v node_modules | grep -v ".git" || true)

if [ -n "$HTTP_URLS" ]; then
    finding_medium "HTTP (non-HTTPS) URLs found — potential mixed content"
    echo "$HTTP_URLS" | head -5 | while IFS= read -r line; do
        echo "    → $line"
    done
fi

# ── A06: Vulnerable Components ───────────────────────────────
section "A06: VULNERABLE COMPONENTS"

# Check for SRI on CDN scripts
CDN_SCRIPTS=$(grep -rn --include="*.html" \
  -E '<script\s+src="https://' "$PROJECT_DIR" 2>/dev/null \
  | grep -v node_modules || true)

if [ -n "$CDN_SCRIPTS" ]; then
    NO_SRI=$(echo "$CDN_SCRIPTS" | grep -v "integrity=" || true)
    if [ -n "$NO_SRI" ]; then
        finding_high "CDN scripts WITHOUT Subresource Integrity (SRI):"
        echo "$NO_SRI" | while IFS= read -r line; do
            echo "    → $line"
        done
    else
        finding_info "All CDN scripts have SRI ✓"
    fi
fi

# npm audit (if package.json exists)
if [ -f "$PROJECT_DIR/package.json" ]; then
    if command -v npm &> /dev/null; then
        AUDIT_RESULT=$(npm audit --production --json 2>/dev/null || true)
        VULNERABILITIES=$(echo "$AUDIT_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}))" 2>/dev/null || echo "")
        if [ -n "$VULNERABILITIES" ]; then
            finding_medium "npm audit results: $VULNERABILITIES"
        fi
    fi
fi

# ── A05: Security Misconfiguration ──────────────────────────
section "A05: SECURITY MISCONFIGURATION"

# Debug mode indicators
DEBUG=$(grep -rn --include="*.js" --include="*.ts" --include="*.json" \
  -iE "(debug\s*[:=]\s*true|debugMode|NODE_ENV.*development)" "$PROJECT_DIR" 2>/dev/null \
  | grep -v node_modules | grep -v ".git" || true)

if [ -n "$DEBUG" ]; then
    finding_medium "Debug mode indicators found (ensure disabled in production)"
    echo "$DEBUG" | head -3 | while IFS= read -r line; do
        echo "    → $line"
    done
fi

# console.log in production
CONSOLE_LOGS=$(grep -rn --include="*.js" --include="*.ts" \
  "console\.\(log\|debug\|trace\)" "$PROJECT_DIR" 2>/dev/null \
  | grep -v node_modules | grep -v ".git" || true)

if [ -n "$CONSOLE_LOGS" ]; then
    COUNT=$(echo "$CONSOLE_LOGS" | wc -l)
    finding_low "Found $COUNT console.log/debug/trace statements (remove for production)"
fi

# ── A08: Integrity — .gitignore check ────────────────────────
section "A08: SOFTWARE INTEGRITY"

if [ -f "$PROJECT_DIR/.gitignore" ]; then
    grep -q ".env" "$PROJECT_DIR/.gitignore" && finding_info ".env in .gitignore ✓" || finding_high ".env NOT in .gitignore"
    grep -q "node_modules" "$PROJECT_DIR/.gitignore" && finding_info "node_modules in .gitignore ✓" || finding_medium "node_modules NOT in .gitignore"
else
    finding_medium "No .gitignore file found"
fi

# ── Data Protection ─────────────────────────────────────────
section "DATA PROTECTION"

# localStorage usage
LOCAL_STORAGE=$(grep -rn --include="*.js" --include="*.ts" \
  "localStorage\.\(setItem\|getItem\)" "$PROJECT_DIR" 2>/dev/null \
  | grep -v node_modules | grep -v ".git" || true)

if [ -n "$LOCAL_STORAGE" ]; then
    finding_low "localStorage usage detected — ensure no PII/sensitive data stored"
    echo "$LOCAL_STORAGE" | while IFS= read -r line; do
        echo "    → $line"
    done
else
    finding_info "No localStorage usage detected ✓"
fi

# ── Summary ─────────────────────────────────────────────────
section "SUMMARY"
echo ""
TOTAL=$((CRITICAL + HIGH + MEDIUM + LOW + INFO))
echo "╔══════════════════════════════════════════════════╗"
echo "║          🛡️ SECURITY AUDIT RESULTS               ║"
echo "╠══════════════════════════════════════════════════╣"
printf "║  🔴 Critical:  %-4s                              ║\n" "$CRITICAL"
printf "║  🟠 High:      %-4s                              ║\n" "$HIGH"
printf "║  🟡 Medium:    %-4s                              ║\n" "$MEDIUM"
printf "║  🟢 Low:       %-4s                              ║\n" "$LOW"
printf "║  ℹ️  Info:      %-4s                              ║\n" "$INFO"
printf "║  Total:        %-4s findings                     ║\n" "$TOTAL"
echo "╠══════════════════════════════════════════════════╣"
if [ $CRITICAL -gt 0 ]; then
    echo "║  Risk: 🔴 HIGH — Critical issues must be fixed   ║"
elif [ $HIGH -gt 0 ]; then
    echo "║  Risk: 🟠 MEDIUM — Significant issues found      ║"
elif [ $MEDIUM -gt 0 ]; then
    echo "║  Risk: 🟡 LOW — Minor improvements recommended   ║"
else
    echo "║  Risk: 🟢 MINIMAL — Good security posture        ║"
fi
echo "╚══════════════════════════════════════════════════╝"
