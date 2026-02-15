# 🧠 Common AI Hallucination Patterns Database

Reference of frequently hallucinated code patterns by AI coding assistants. Use this to train detection rules.

---

## JavaScript / Browser API Hallucinations

### DOM Manipulation
| ❌ Hallucinated | ✅ Correct | Frequency |
|:----------------|:-----------|:----------|
| `element.addClass('x')` | `element.classList.add('x')` | 🔴 Very Common |
| `element.removeClass('x')` | `element.classList.remove('x')` | 🔴 Very Common |
| `element.hasClass('x')` | `element.classList.contains('x')` | 🔴 Very Common |
| `element.attr('x')` | `element.getAttribute('x')` | 🟠 Common |
| `element.css('prop', 'val')` | `element.style.prop = 'val'` | 🟠 Common |
| `element.on('click', fn)` | `element.addEventListener('click', fn)` | 🔴 Very Common |
| `element.off('click', fn)` | `element.removeEventListener('click', fn)` | 🟠 Common |
| `element.trigger('click')` | `element.click()` or `element.dispatchEvent(new Event('click'))` | 🟡 Occasional |
| `document.getElementById('#id')` | `document.getElementById('id')` (no #) | 🔴 Very Common |
| `document.find('.class')` | `document.querySelector('.class')` | 🟠 Common |
| `document.findAll('.class')` | `document.querySelectorAll('.class')` | 🟠 Common |

> **Root cause**: AI confuses jQuery patterns with vanilla JS

### Storage & Clipboard
| ❌ Hallucinated | ✅ Correct | Frequency |
|:----------------|:-----------|:----------|
| `localStorage.get('key')` | `localStorage.getItem('key')` | 🟠 Common |
| `localStorage.set('key', val)` | `localStorage.setItem('key', val)` | 🟠 Common |
| `localStorage.delete('key')` | `localStorage.removeItem('key')` | 🟡 Occasional |
| `navigator.clipboard.copy(text)` | `navigator.clipboard.writeText(text)` | 🟠 Common |
| `navigator.clipboard.paste()` | `navigator.clipboard.readText()` | 🟡 Occasional |

### Fetch & Network
| ❌ Hallucinated | ✅ Correct | Frequency |
|:----------------|:-----------|:----------|
| `fetch(url).data` | `fetch(url).then(r => r.json())` | 🟠 Common |
| `fetch(url, { body: obj })` | `fetch(url, { body: JSON.stringify(obj) })` | 🟠 Common |
| `response.body.json()` | `response.json()` | 🟡 Occasional |
| `axios.request.get()` | `axios.get()` | 🟡 Occasional |

### CSS / Style
| ❌ Hallucinated | ✅ Correct | Frequency |
|:----------------|:-----------|:----------|
| `element.style.display = 'hidden'` | `element.style.display = 'none'` | 🔴 Very Common |
| `element.style.visibility = 'none'` | `element.style.visibility = 'hidden'` | 🟠 Common |
| `element.style.display = 'visible'` | `element.style.display = 'block'` (or remove) | 🟠 Common |

### Navigation
| ❌ Hallucinated | ✅ Correct | Frequency |
|:----------------|:-----------|:----------|
| `window.location.redirect(url)` | `window.location.href = url` | 🟠 Common |
| `window.navigate(url)` | `window.location.href = url` | 🟡 Occasional |
| `history.navigate(url)` | `history.pushState(null, '', url)` | 🟡 Occasional |

---

## CSS Property Hallucinations

| ❌ Hallucinated | ✅ Correct |
|:----------------|:-----------|
| `backdrop-blur: 10px` | `backdrop-filter: blur(10px)` |
| `text-gradient: linear-gradient(...)` | `background: linear-gradient(...); -webkit-background-clip: text; color: transparent` |
| `shadow-color: red` | Part of `box-shadow` shorthand |
| `border-radius-top: 10px` | `border-top-left-radius: 10px; border-top-right-radius: 10px` |
| `animation-play: running` | `animation-play-state: running` |
| `flex-gap: 10px` | `gap: 10px` |
| `font-color: red` | `color: red` |
| `text-bold` | `font-weight: bold` |
| `background-opacity: 0.5` | `background-color: rgba(0,0,0,0.5)` |

---

## Structural Hallucinations

### Phantom Files & Modules
- ❌ Importing from `./utils.js` when no such file exists
- ❌ Importing from `./config.js` when config is inline
- ❌ Referencing `package.json` scripts that don't exist

### Framework Confusion
- ❌ Using `this.setState()` in vanilla JS (React pattern)
- ❌ Using `v-model` in plain HTML (Vue pattern)
- ❌ Using `ngIf` in non-Angular code
- ❌ Using `<Link>` component without React Router
- ❌ Using `$emit()` in non-Vue code

### API Invention
- ❌ `Array.flatten()` → `Array.flat()`
- ❌ `String.contains()` → `String.includes()`
- ❌ `Object.length` → `Object.keys(obj).length`
- ❌ `Math.parseInt()` → `parseInt()` or `Number.parseInt()`
- ❌ `Array.forEach()` (static) → `[].forEach()` (instance)
- ❌ `console.write()` → `console.log()`
- ❌ `JSON.parse(obj)` when obj is already an object

---

## Detection Rules (Regex)

```bash
# jQuery in vanilla projects
grep -nP "\.(addClass|removeClass|hasClass|attr\(|css\(|on\(|off\(|trigger\(|find\(|html\(|text\(|val\(|prop\(|show\(|hide\(|toggle\(|fadeIn|fadeOut|slideUp|slideDown|animate\()" *.js

# React patterns outside React
grep -nP "(this\.setState|useState|useEffect|useRef|React\.createElement)" *.js

# Wrong display values
grep -nP "display\s*[:=]\s*['\"]?(hidden|visible)['\"]?" *.js *.css

# getElementById with #
grep -nP "getElementById\(['\"]#" *.js

# Wrong localStorage methods
grep -nP "localStorage\.(get|set|delete)\(" *.js

# Wrong clipboard API
grep -nP "clipboard\.(copy|paste)\(" *.js
```

---

## Prevention Strategies

1. **Always verify against MDN**: If unsure about a browser API, check [developer.mozilla.org](https://developer.mozilla.org)
2. **No jQuery assumptions**: Default to vanilla JS unless jQuery is explicitly included
3. **Framework-aware**: Check `package.json` or `<script>` tags before using framework-specific patterns
4. **Type checking**: If TypeScript is available, it catches most hallucinated APIs at compile time
5. **Linting**: ESLint with `no-undef` and `no-unused-vars` catches phantom references
