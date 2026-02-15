#!/usr/bin/env bash
# ============================================================
# AI Hallucination Guard — Automated Code Consistency Check
# Detects phantom imports, broken selectors, missing functions
# Usage: bash hallucination-check.sh [PROJECT_DIR]
# ============================================================

set -euo pipefail

PROJECT_DIR="${1:-.}"
CRASHES=0
LOGIC=0
COSMETIC=0
DEAD=0
CLEAN=0

RED='\033[0;31m'
ORANGE='\033[0;33m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

crash()    { echo -e "${RED}🔴 CRASH${NC}:    $1"; ((CRASHES++)); }
logic()    { echo -e "${ORANGE}🟠 LOGIC${NC}:    $1"; ((LOGIC++)); }
cosmetic() { echo -e "${YELLOW}🟡 COSMETIC${NC}: $1"; ((COSMETIC++)); }
dead()     { echo -e "${GREEN}🟢 DEAD${NC}:     $1"; ((DEAD++)); }
clean()    { echo -e "${GREEN}✅ CLEAN${NC}:    $1"; ((CLEAN++)); }
section()  { echo -e "\n${CYAN}═══ $1 ═══${NC}"; }

echo "╔══════════════════════════════════════════════════╗"
echo "║     🤖 AI Hallucination Guard                    ║"
echo "║     Target: $PROJECT_DIR"
echo "║     Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "╚══════════════════════════════════════════════════╝"

# ── 1. Import Resolution ────────────────────────────────────
section "IMPORT RESOLUTION"

# Find all ES module imports
IMPORTS=$(grep -rn --include="*.js" --include="*.ts" \
  "import.*from\s*['\"]" "$PROJECT_DIR" 2>/dev/null \
  | grep -v node_modules | grep -v ".git" || true)

if [ -n "$IMPORTS" ]; then
    echo "$IMPORTS" | while IFS= read -r line; do
        FILE=$(echo "$line" | cut -d: -f1)
        DIR=$(dirname "$FILE")

        # Extract module path
        MODULE=$(echo "$line" | grep -oP "from\s*['\"]([^'\"]+)" | sed "s/from\s*['\"]//")

        if [ -z "$MODULE" ]; then
            continue
        fi

        # Skip npm packages (no ./ or ../)
        if [[ ! "$MODULE" == .* ]]; then
            continue
        fi

        # Resolve relative path
        RESOLVED="$DIR/$MODULE"

        # Check if file exists (with or without extension)
        if [ -f "$RESOLVED" ] || [ -f "${RESOLVED}.js" ] || [ -f "${RESOLVED}.ts" ] || [ -f "${RESOLVED}/index.js" ]; then
            clean "Import resolves: $MODULE (in $(basename "$FILE"))"

            # Now check if imported symbols exist
            ACTUAL_FILE="$RESOLVED"
            [ ! -f "$ACTUAL_FILE" ] && ACTUAL_FILE="${RESOLVED}.js"
            [ ! -f "$ACTUAL_FILE" ] && ACTUAL_FILE="${RESOLVED}.ts"

            if [ -f "$ACTUAL_FILE" ]; then
                # Extract imported symbols
                SYMBOLS=$(echo "$line" | grep -oP '\{\s*([^}]+)\s*\}' | tr -d '{}' | tr ',' '\n' | sed 's/\s*as\s*\w*//g' | tr -d ' ' || true)

                if [ -n "$SYMBOLS" ]; then
                    echo "$SYMBOLS" | while IFS= read -r sym; do
                        [ -z "$sym" ] && continue
                        if grep -q "$sym" "$ACTUAL_FILE" 2>/dev/null; then
                            clean "  Symbol '$sym' found in $(basename "$ACTUAL_FILE")"
                        else
                            crash "  Symbol '$sym' NOT found in $(basename "$ACTUAL_FILE") — PHANTOM IMPORT"
                        fi
                    done
                fi
            fi
        else
            crash "Import NOT found: $MODULE (in $(basename "$FILE"))"
        fi
    done
else
    echo "  No ES module imports found"
fi

# ── 2. DOM Selector Cross-Check ─────────────────────────────
section "DOM SELECTOR CROSS-CHECK"

# Extract IDs from JS
JS_IDS=$(grep -ohP "getElementById\(['\"]([^'\"]+)['\"]" "$PROJECT_DIR"/js/*.js 2>/dev/null \
  | sed "s/getElementById(['\"]//;s/['\"]$//" | sort -u || true)

# Extract IDs from HTML
HTML_IDS=$(grep -ohP 'id="([^"]+)"' "$PROJECT_DIR"/*.html 2>/dev/null \
  | sed 's/id="//;s/"$//' | sort -u || true)

# Also extract dynamically-generated IDs from JS template literals
DYNAMIC_IDS=$(grep -ohP "id=\"([^\"]*)\\\$\{" "$PROJECT_DIR"/js/*.js 2>/dev/null | sort -u || true)
DYNAMIC_PREFIXES=$(grep -ohP 'id="([a-zA-Z-]+)\$' "$PROJECT_DIR"/js/*.js 2>/dev/null \
  | sed 's/id="//;s/\$$//' | sort -u || true)

if [ -n "$JS_IDS" ]; then
    echo "$JS_IDS" | while IFS= read -r jsid; do
        [ -z "$jsid" ] && continue

        # Check in static HTML
        if echo "$HTML_IDS" | grep -qx "$jsid" 2>/dev/null; then
            clean "ID '$jsid' found in HTML ✓"
        else
            # Check if it matches a dynamic pattern
            IS_DYNAMIC=false
            if [ -n "$DYNAMIC_PREFIXES" ]; then
                echo "$DYNAMIC_PREFIXES" | while IFS= read -r prefix; do
                    if [[ "$jsid" == "$prefix"* ]]; then
                        IS_DYNAMIC=true
                    fi
                done
            fi

            # Check if created dynamically in JS innerHTML
            if grep -q "id=\"$jsid\"" "$PROJECT_DIR"/js/*.js 2>/dev/null || \
               grep -q "id=\\\\\"$jsid\\\\\"" "$PROJECT_DIR"/js/*.js 2>/dev/null; then
                clean "ID '$jsid' dynamically created in JS ✓"
            else
                cosmetic "ID '$jsid' referenced in JS but NOT found in HTML or dynamic generation"
            fi
        fi
    done
else
    echo "  No getElementById calls found"
fi

# ── 3. Window Functions Check ────────────────────────────────
section "WINDOW FUNCTIONS"

# Functions attached to window in JS
WIN_FUNCS=$(grep -ohP "window\.(\w+)\s*=" "$PROJECT_DIR"/js/*.js 2>/dev/null \
  | sed 's/window\.//;s/\s*=$//' | sort -u || true)

# Functions called from onclick in HTML
HTML_FUNCS=$(grep -ohP 'onclick="(\w+)\(' "$PROJECT_DIR"/*.html 2>/dev/null \
  | sed 's/onclick="//;s/($//' | sort -u || true)

if [ -n "$HTML_FUNCS" ]; then
    echo "$HTML_FUNCS" | while IFS= read -r func; do
        [ -z "$func" ] && continue
        if echo "$WIN_FUNCS" | grep -qx "$func" 2>/dev/null; then
            clean "onclick='$func()' → window.$func exists ✓"
        else
            crash "onclick='$func()' but window.$func is NEVER DEFINED — will crash on click!"
        fi
    done
else
    echo "  No onclick handlers in HTML"
fi

# ── 4. CSS Class Usage ──────────────────────────────────────
section "CSS CLASS USAGE (sample)"

# Extract classList.add/toggle/remove references from JS
JS_CLASSES=$(grep -ohP "classList\.(add|remove|toggle)\(['\"]([^'\"]+)" "$PROJECT_DIR"/js/*.js 2>/dev/null \
  | grep -oP "['\"][^'\"]+['\"]$" | tr -d "'\""  | sort -u | head -20 || true)

if [ -n "$JS_CLASSES" ]; then
    echo "$JS_CLASSES" | while IFS= read -r cls; do
        [ -z "$cls" ] && continue
        if grep -q "\.$cls" "$PROJECT_DIR"/css/*.css 2>/dev/null; then
            clean "CSS class '.$cls' defined ✓"
        elif grep -q "$cls" "$PROJECT_DIR"/js/*.js 2>/dev/null; then
            cosmetic "CSS class '.$cls' used in JS but NOT found in CSS (may be dynamic)"
        fi
    done
fi

# ── 5. Dangerous Patterns ───────────────────────────────────
section "DANGEROUS AI PATTERNS"

# Check for common AI hallucination patterns in code
PATTERNS=(
    "navigator.clipboard.copy"
    "document.querySelector().on("
    "localStorage.get("
    "localStorage.set("
    "element.addClass("
    "element.removeClass("
    "\.attr("
    "\.prop("
    "\.val("
    "React.useState\|this.setState"
    "document.getElementById('#"
    "style.display.*=.*hidden"
    "window.location.redirect"
    "fetch().data"
    "console.write"
    "Math.parseInt"
    "Array.forEach"
)

for pattern in "${PATTERNS[@]}"; do
    FOUND=$(grep -rn --include="*.js" --include="*.ts" "$pattern" "$PROJECT_DIR" 2>/dev/null \
      | grep -v node_modules | grep -v ".git" || true)
    if [ -n "$FOUND" ]; then
        logic "Hallucinated API pattern found: '$pattern'"
        echo "$FOUND" | head -3 | while IFS= read -r line; do
            echo "    → $line"
        done
    fi
done

clean "Dangerous pattern scan complete"

# ── Summary ─────────────────────────────────────────────────
section "SUMMARY"
echo ""
TOTAL=$((CRASHES + LOGIC + COSMETIC + DEAD))
echo "╔══════════════════════════════════════════════════╗"
echo "║       🤖 HALLUCINATION GUARD RESULTS             ║"
echo "╠══════════════════════════════════════════════════╣"
printf "║  🔴 Crash risks:   %-4s                         ║\n" "$CRASHES"
printf "║  🟠 Logic bugs:    %-4s                         ║\n" "$LOGIC"
printf "║  🟡 Cosmetic:      %-4s                         ║\n" "$COSMETIC"
printf "║  🟢 Dead code:     %-4s                         ║\n" "$DEAD"
printf "║  ✅ Clean checks:  %-4s                         ║\n" "$CLEAN"
echo "╠══════════════════════════════════════════════════╣"
if [ $CRASHES -gt 0 ]; then
    echo "║  Status: ❌ BROKEN — runtime crashes expected    ║"
elif [ $LOGIC -gt 0 ]; then
    echo "║  Status: ⚠️  ISSUES — logic bugs detected        ║"
elif [ $COSMETIC -gt 0 ]; then
    echo "║  Status: 🟡 MINOR — cosmetic issues only        ║"
else
    echo "║  Status: ✅ CLEAN — no hallucinations detected   ║"
fi
echo "╚══════════════════════════════════════════════════╝"
