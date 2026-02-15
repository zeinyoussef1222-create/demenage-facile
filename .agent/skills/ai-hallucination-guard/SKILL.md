---
name: ai-hallucination-guard
description: Automated detection and correction of AI-generated code bugs, hallucinations, and phantom references. Validates cross-file consistency, import integrity, DOM selectors, and API usage patterns.
---

# 🤖 AI Hallucination Guard Skill

When activated, systematically verify AI-generated code for common hallucination patterns: phantom imports, non-existent functions, fake API methods, broken cross-file references, and DOM selector mismatches.

---

## Step 1: Import & Export Integrity

### 1.1 Verify All Imports Resolve
For every `import` statement, verify the imported module exists and exports the referenced symbols.

**Procedure:**
1. Find all `import { X, Y } from './module.js'` statements
2. Open the referenced module file
3. Verify that `X` and `Y` are actually exported
4. Flag any symbols that don't exist in the source module

**Regex search pattern:**
```bash
# Find all ES module imports
grep -rn --include="*.js" --include="*.ts" "import.*from" .

# Find all exports in a file
grep -n "export " ./path/to/module.js
```

**Common hallucinations:**
- ❌ Importing a function that was never written
- ❌ Importing from a file that doesn't exist
- ❌ Wrong export name (typo or AI-invented name)
- ❌ Importing default when module uses named exports (or vice versa)

### 1.2 Verify All Exports Are Used
Check for dead exports (exported but never imported anywhere).

```bash
# For each export, check if it's imported somewhere
grep -rn --include="*.js" "export function functionName"
grep -rn --include="*.js" "functionName" . | grep "import"
```

---

## Step 2: DOM Selector Consistency

### 2.1 ID Selectors
Every `getElementById('X')` or `querySelector('#X')` must have a corresponding `id="X"` in the HTML.

**Procedure:**
1. Extract all ID references from JavaScript:
   ```bash
   grep -oP "getElementById\(['\"]([^'\"]+)" js/*.js | sed "s/.*['\"]//g" | sort -u
   ```
2. Extract all IDs from HTML:
   ```bash
   grep -oP 'id="([^"]+)"' *.html | sed 's/id="//;s/"$//' | sort -u
   ```
3. Also check dynamically-generated IDs in JavaScript template literals
4. Cross-reference: every JS ID reference must exist in HTML or be generated dynamically

**Common hallucinations:**
- ❌ `getElementById('main-content')` but HTML has `id="content-main"`
- ❌ Referring to an ID within `innerHTML` that is never created
- ❌ Typo between camelCase and kebab-case (`navBar` vs `nav-bar`)

### 2.2 Class Selectors
Every `querySelector('.X')` or `classList.add('X')` should have corresponding CSS rules.

```bash
# Extract class references from JS
grep -oP "(querySelector|classList\.(add|remove|toggle|contains))\(['\"]\.?([^'\"]+)" js/*.js

# Extract class definitions from CSS
grep -oP '\.([a-zA-Z][\w-]+)' css/*.css | sed 's/^\.//' | sort -u
```

### 2.3 Data Attributes
Every `dataset.X` or `[data-X]` in JS must have corresponding `data-X` attributes in HTML.

---

## Step 3: Function & Variable Consistency

### 3.1 Window-Attached Functions
Functions attached to `window` (for inline `onclick` handlers) must exist.

**Procedure:**
1. Find all `window.functionName = ...` in JS
2. Find all `onclick="functionName()"` in HTML
3. Verify every HTML-referenced function is attached to window

```bash
# JS: window-attached functions
grep -oP "window\.(\w+)\s*=" js/*.js | sed 's/window\.//;s/\s*=//' | sort -u

# HTML: onclick references
grep -oP 'onclick="(\w+)\(' *.html | sed 's/onclick="//;s/($//' | sort -u
```

### 3.2 Callback References
Verify that event listeners reference functions that exist:

```bash
# Functions passed to addEventListener
grep -oP "addEventListener\([^,]+,\s*(\w+)" js/*.js
```

### 3.3 Undefined Variable Detection
Look for variables used but never declared:

**Common hallucination patterns:**
- ❌ Using `config.apiUrl` when no `config` object exists
- ❌ Referencing `utils.formatDate()` when no `utils` module exists
- ❌ Calling `this.setState()` in a non-React project
- ❌ Using `req.body` in client-side code

---

## Step 4: API & Library Validation

### 4.1 Browser API Correctness
Verify that browser APIs are called correctly:

| ❌ Hallucinated API | ✅ Correct API |
|:---------------------|:---------------|
| `navigator.clipboard.copy()` | `navigator.clipboard.writeText()` |
| `document.querySelector().on()` | `element.addEventListener()` |
| `fetch().data` | `fetch().then(r => r.json())` |
| `localStorage.get()` | `localStorage.getItem()` |
| `element.addClass()` | `element.classList.add()` |
| `array.includes(x, start, end)` | `array.includes(x, start)` (2 args max) |
| `JSON.stringify(obj, pretty)` | `JSON.stringify(obj, null, 2)` |
| `document.getElementById('#id')` | `document.getElementById('id')` (no #) |
| `element.style.display = 'hidden'` | `element.style.display = 'none'` |
| `window.location.redirect()` | `window.location.href = '...'` |

### 4.2 Third-Party Library API
For every third-party library used, verify:
1. The library is actually loaded (script tag or import)
2. The API methods called exist in that library's version
3. Constructor signatures are correct

**Common hallucinations:**
- ❌ Using `jsPDF.addText()` (doesn't exist → it's `doc.text()`)
- ❌ Calling `moment().formatDate()` (it's `moment().format()`)
- ❌ Using `axios.request.get()` (it's `axios.get()`)
- ❌ Passing wrong parameter types (number where string is expected)

### 4.3 CSS Property Validation
Check for invented CSS properties:

| ❌ Hallucinated | ✅ Correct |
|:----------------|:-----------|
| `backdrop-blur` | `backdrop-filter: blur()` |
| `text-gradient` | `background: linear-gradient(); -webkit-background-clip: text` |
| `shadow-color` | `box-shadow: ... color` |
| `animation-play` | `animation-play-state` |
| `flex-gap` | `gap` |
| `border-radius-top` | `border-top-left-radius` + `border-top-right-radius` |

---

## Step 5: Cross-File Data Flow

### 5.1 Data Shape Consistency
When an object is created in one file and consumed in another, verify the property names match.

**Example hallucination:**
```javascript
// generator.js creates:
return { organisme, courrier, email, mailtoLink };

// app.js expects:
doc.letter  // ❌ Should be doc.courrier
doc.mailto  // ❌ Should be doc.mailtoLink
```

**Procedure:**
1. Identify data objects that cross module boundaries
2. List all properties set by the producer
3. List all properties accessed by the consumer
4. Flag any access to properties that don't exist

### 5.2 Function Signature Consistency
Verify that functions are called with the correct number and type of arguments.

```bash
# Find function definitions and their parameters
grep -P "function \w+\(" js/*.js
grep -P "(const|let|var) \w+ = \(" js/*.js

# Find call sites and count arguments
grep -P "\w+\(" js/*.js
```

---

## Step 6: Self-Healing Procedure

When an issue is found:

1. **Classify severity:**
   - 🔴 **CRASH**: Will cause runtime error (missing import, undefined function)
   - 🟠 **LOGIC**: Silent bug, wrong behavior (wrong property name, typo)
   - 🟡 **COSMETIC**: UI glitch (missing CSS class, wrong selector)
   - 🟢 **DEAD CODE**: Unused exports/variables (no runtime impact)

2. **Auto-fix if possible:**
   - Missing import → add the import or remove the usage
   - Wrong API → replace with correct API call
   - Typo in selector → fix to match HTML
   - Unused export → remove or comment out

3. **Report if ambiguous:**
   - Multiple possible fixes → ask user
   - Architectural issue → recommend refactor
   - Missing feature → flag as TODO

---

## Step 7: Verification Report

```
╔══════════════════════════════════════════════════╗
║       🤖 AI HALLUCINATION GUARD REPORT           ║
╠══════════════════════════════════════════════════╣
║ Files scanned:    [count]                        ║
║ Imports checked:  [count]                        ║
║ DOM selectors:    [count]                        ║
║ API calls:        [count]                        ║
╠══════════════════════════════════════════════════╣
║ 🔴 Crash risks:   [count]                       ║
║ 🟠 Logic bugs:    [count]                       ║
║ 🟡 Cosmetic:      [count]                       ║
║ 🟢 Dead code:     [count]                       ║
║ ✅ Auto-fixed:    [count]                        ║
╠══════════════════════════════════════════════════╣
║ Confidence:  [HIGH/MEDIUM/LOW]                   ║
║ Status:      [✅ CLEAN / ⚠️ ISSUES / ❌ BROKEN] ║
╚══════════════════════════════════════════════════╝
```
