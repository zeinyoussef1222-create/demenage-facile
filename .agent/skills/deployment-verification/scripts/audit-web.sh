#!/usr/bin/env bash
# ============================================================
# DéménageFacile — Web Deployment Audit Script
# Runs automated checks for web deployment readiness
# Usage: bash audit-web.sh [URL_OR_PATH]
# ============================================================

set -euo pipefail

TARGET="${1:-http://localhost:3000}"
REPORT_FILE="deployment-audit-report.txt"
ERRORS=0
WARNINGS=0
PASSES=0

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_pass()    { echo -e "${GREEN}✅ PASS${NC}: $1"; ((PASSES++)); }
log_warn()    { echo -e "${YELLOW}⚠️  WARN${NC}: $1"; ((WARNINGS++)); }
log_fail()    { echo -e "${RED}❌ FAIL${NC}: $1"; ((ERRORS++)); }
log_info()    { echo -e "${CYAN}ℹ️  INFO${NC}: $1"; }
log_section() { echo -e "\n${CYAN}═══ $1 ═══${NC}"; }

echo "╔══════════════════════════════════════════════════╗"
echo "║     🚀 Web Deployment Audit                     ║"
echo "║     Target: $TARGET"
echo "║     Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. HTML Validation ──────────────────────────────────────
log_section "HTML VALIDATION"

if [ -f "index.html" ]; then
    # Check for essential meta tags
    grep -q '<title>' index.html && log_pass "Title tag found" || log_fail "Missing <title> tag"
    grep -q 'meta name="description"' index.html && log_pass "Meta description found" || log_warn "Missing meta description"
    grep -q 'meta name="viewport"' index.html && log_pass "Viewport meta found" || log_fail "Missing viewport meta tag"
    grep -q 'rel="icon"' index.html && log_pass "Favicon found" || log_warn "Missing favicon"

    # Open Graph
    grep -q 'og:title' index.html && log_pass "OG:title found" || log_warn "Missing Open Graph title"
    grep -q 'og:description' index.html && log_pass "OG:description found" || log_warn "Missing Open Graph description"
    grep -q 'og:image' index.html && log_pass "OG:image found" || log_warn "Missing Open Graph image"

    # Semantic HTML
    grep -q '<main' index.html && log_pass "Semantic <main> tag found" || log_warn "Missing <main> tag"
    grep -q '<nav' index.html && log_pass "Semantic <nav> tag found" || log_info "No <nav> tag (optional)"
    grep -q '<footer' index.html && log_pass "Semantic <footer> tag found" || log_info "No <footer> tag (optional)"

    # Check heading hierarchy
    H1_COUNT=$(grep -c '<h1' index.html 2>/dev/null || echo "0")
    if [ "$H1_COUNT" -eq 1 ]; then
        log_pass "Single <h1> tag found"
    elif [ "$H1_COUNT" -eq 0 ]; then
        log_fail "No <h1> tag found"
    else
        log_warn "Multiple <h1> tags found ($H1_COUNT) — SEO recommends exactly one"
    fi

    # HTTPS resources
    if grep -qP 'src="http://' index.html 2>/dev/null || grep -qP "src='http://" index.html 2>/dev/null; then
        log_fail "Mixed content: HTTP resources found (should use HTTPS)"
    else
        log_pass "No mixed content — all resources use HTTPS or relative paths"
    fi

    # Alt attributes on images
    IMG_COUNT=$(grep -c '<img' index.html 2>/dev/null || echo "0")
    IMG_NO_ALT=$(grep '<img' index.html 2>/dev/null | grep -cv 'alt=' 2>/dev/null || echo "0")
    if [ "$IMG_COUNT" -gt 0 ] && [ "$IMG_NO_ALT" -gt 0 ]; then
        log_warn "$IMG_NO_ALT image(s) without alt attribute"
    elif [ "$IMG_COUNT" -gt 0 ]; then
        log_pass "All images have alt attributes"
    fi
else
    log_fail "index.html not found in current directory"
fi

# ── 2. CSS Validation ───────────────────────────────────────
log_section "CSS VALIDATION"

CSS_FILES=$(find . -name "*.css" -not -path "*/node_modules/*" 2>/dev/null)
if [ -n "$CSS_FILES" ]; then
    TOTAL_CSS_SIZE=0
    while IFS= read -r cssfile; do
        SIZE=$(wc -c < "$cssfile")
        TOTAL_CSS_SIZE=$((TOTAL_CSS_SIZE + SIZE))
        log_info "$(basename "$cssfile"): ${SIZE} bytes"
    done <<< "$CSS_FILES"

    if [ $TOTAL_CSS_SIZE -lt 100000 ]; then
        log_pass "Total CSS size: ${TOTAL_CSS_SIZE} bytes (< 100KB)"
    elif [ $TOTAL_CSS_SIZE -lt 250000 ]; then
        log_warn "Total CSS size: ${TOTAL_CSS_SIZE} bytes (consider minifying)"
    else
        log_fail "Total CSS size: ${TOTAL_CSS_SIZE} bytes (> 250KB, needs optimization)"
    fi
else
    log_warn "No CSS files found"
fi

# ── 3. JavaScript Validation ────────────────────────────────
log_section "JAVASCRIPT VALIDATION"

JS_FILES=$(find . -name "*.js" -not -path "*/node_modules/*" 2>/dev/null)
if [ -n "$JS_FILES" ]; then
    TOTAL_JS_SIZE=0
    while IFS= read -r jsfile; do
        SIZE=$(wc -c < "$jsfile")
        TOTAL_JS_SIZE=$((TOTAL_JS_SIZE + SIZE))
        log_info "$(basename "$jsfile"): ${SIZE} bytes"

        # Check for common issues
        if grep -q 'console.log' "$jsfile" 2>/dev/null; then
            log_warn "console.log found in $(basename "$jsfile") — remove for production"
        fi
        if grep -q 'debugger' "$jsfile" 2>/dev/null; then
            log_fail "debugger statement found in $(basename "$jsfile")"
        fi
        if grep -qP 'password|secret|api[_-]?key' "$jsfile" 2>/dev/null; then
            log_fail "Potential secrets/API keys in $(basename "$jsfile")"
        fi
    done <<< "$JS_FILES"

    if [ $TOTAL_JS_SIZE -lt 200000 ]; then
        log_pass "Total JS size: ${TOTAL_JS_SIZE} bytes (< 200KB)"
    elif [ $TOTAL_JS_SIZE -lt 500000 ]; then
        log_warn "Total JS size: ${TOTAL_JS_SIZE} bytes (consider code splitting)"
    else
        log_fail "Total JS size: ${TOTAL_JS_SIZE} bytes (> 500KB, needs optimization)"
    fi
else
    log_warn "No JavaScript files found"
fi

# ── 4. Asset Checks ─────────────────────────────────────────
log_section "ASSETS"

TOTAL_SIZE=$(find . -not -path "*/node_modules/*" -not -path "*/.git/*" -type f -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print $1}')
log_info "Total project size: ${TOTAL_SIZE} bytes"

IMG_FILES=$(find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.webp" -o -name "*.svg" 2>/dev/null | grep -v node_modules | grep -v .git)
if [ -n "$IMG_FILES" ]; then
    while IFS= read -r img; do
        SIZE=$(wc -c < "$img")
        if [ "$SIZE" -gt 500000 ]; then
            log_warn "Large image: $(basename "$img") (${SIZE} bytes) — consider compression"
        fi
    done <<< "$IMG_FILES"
else
    log_info "No image files found"
fi

# ── 5. Connectivity Check ───────────────────────────────────
log_section "CONNECTIVITY"

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log_pass "Server responds with HTTP 200 at $TARGET"
    elif [ "$HTTP_CODE" = "000" ]; then
        log_warn "Could not connect to $TARGET (server may not be running)"
    else
        log_fail "Server responds with HTTP $HTTP_CODE at $TARGET"
    fi
else
    log_info "curl not available, skipping connectivity check"
fi

# ── Summary ─────────────────────────────────────────────────
log_section "SUMMARY"
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║               AUDIT RESULTS                     ║"
echo "╠══════════════════════════════════════════════════╣"
printf "║  🟢 Passed:   %-4s                              ║\n" "$PASSES"
printf "║  🟡 Warnings: %-4s                              ║\n" "$WARNINGS"
printf "║  🔴 Errors:   %-4s                              ║\n" "$ERRORS"
echo "╠══════════════════════════════════════════════════╣"
if [ $ERRORS -eq 0 ]; then
    echo "║  Status: ✅ READY FOR DEPLOYMENT                ║"
elif [ $ERRORS -le 2 ]; then
    echo "║  Status: ⚠️  FIX ISSUES BEFORE DEPLOYING        ║"
else
    echo "║  Status: ❌ NOT READY — CRITICAL ISSUES         ║"
fi
echo "╚══════════════════════════════════════════════════╝"
