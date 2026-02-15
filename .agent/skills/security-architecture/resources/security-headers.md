# 🔒 HTTP Security Headers Reference

Quick reference for configuring HTTP security headers across platforms.

---

## Headers Matrix

| Header | Purpose | Value | Priority |
|:-------|:--------|:------|:---------|
| `Content-Security-Policy` | Prevent XSS, limit resource origins | See detailed config below | 🔴 Critical |
| `Strict-Transport-Security` | Force HTTPS | `max-age=31536000; includeSubDomains; preload` | 🔴 Critical |
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` | 🔴 Critical |
| `X-Frame-Options` | Prevent clickjacking | `DENY` or `SAMEORIGIN` | 🟠 High |
| `Referrer-Policy` | Control referer info leakage | `strict-origin-when-cross-origin` | 🟠 High |
| `Permissions-Policy` | Disable browser APIs | `camera=(), microphone=(), geolocation=()` | 🟡 Medium |
| `Cross-Origin-Opener-Policy` | Isolate browsing context | `same-origin` | 🟡 Medium |
| `Cross-Origin-Embedder-Policy` | Require CORS for subresources | `require-corp` | 🟡 Medium |
| `X-XSS-Protection` | Legacy XSS filter | `0` (disable — CSP is better) | 🟢 Low |

---

## Content-Security-Policy (CSP) Examples

### Strict (recommended for SPAs)
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.yourdomain.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### Moderate (allows more CDN sources)
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https:;
  frame-ancestors 'self';
```

### Report-Only (testing mode)
```
Content-Security-Policy-Report-Only:
  default-src 'self';
  report-uri /csp-report;
```

---

## Platform Configurations

### Apache (.htaccess)
```apache
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
```

### Nginx
```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
```

### Cloudflare Workers
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);
  const headers = new Headers(response.headers);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return new Response(response.body, { status: response.status, headers });
}
```

---

## Testing Security Headers

### Online Tools
- [securityheaders.com](https://securityheaders.com) — Grade A-F
- [observatory.mozilla.org](https://observatory.mozilla.org) — Mozilla's scanner
- [csp-evaluator.withgoogle.com](https://csp-evaluator.withgoogle.com) — CSP validator

### Command Line
```bash
# Check headers with curl
curl -sI https://yourdomain.com | grep -iE "^(content-security|strict-transport|x-content|x-frame|referrer|permissions)"

# Full header dump
curl -sI https://yourdomain.com
```
