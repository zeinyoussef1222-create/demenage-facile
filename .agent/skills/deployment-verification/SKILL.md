---
name: deployment-verification
description: Comprehensive deployment readiness checker for App Store, Google Play Store, and Web applications. Runs automated audits and checklists to ensure your app meets all platform requirements before submission.
---

# 🚀 Deployment Verification Skill

When activated, systematically verify that the application is ready for deployment on the target platform(s). Follow each section relevant to the deployment target.

---

## Step 1: Identify Deployment Targets

Ask the user (or infer from context) which platforms to verify:
- [ ] **Web** (standard deployment, Vercel/Netlify/etc.)
- [ ] **PWA** (Progressive Web App)
- [ ] **App Store** (iOS — Apple)
- [ ] **Play Store** (Android — Google)

---

## Step 2: Web Deployment Checklist

### 2.1 Performance Audit
Run Lighthouse (or equivalent) and ensure:
- [ ] Performance score ≥ 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total bundle size < 500KB (initial load)

**Commands:**
```bash
# If Lighthouse CLI is available
npx -y lighthouse <URL> --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless --no-sandbox"

# Quick bundle check
find . -name "*.js" -not -path "*/node_modules/*" | xargs wc -c | tail -1
find . -name "*.css" -not -path "*/node_modules/*" | xargs wc -c | tail -1
```

### 2.2 SEO & Meta Tags
Verify the following exist in `index.html`:
- [ ] `<title>` tag (50-60 chars)
- [ ] `<meta name="description">` (150-160 chars)
- [ ] `<meta name="viewport">` for mobile
- [ ] `<link rel="icon">` (favicon)
- [ ] Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`)
- [ ] Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`)
- [ ] Canonical URL (`<link rel="canonical">`)
- [ ] Structured data (`application/ld+json`) if applicable

### 2.3 Accessibility (a11y)
- [ ] All images have `alt` attributes
- [ ] All interactive elements have unique IDs
- [ ] Proper heading hierarchy (`h1` > `h2` > `h3`, single `h1`)
- [ ] Sufficient color contrast (WCAG AA = 4.5:1 ratio)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] ARIA labels on non-standard interactive elements
- [ ] Form inputs have associated `<label>` elements

### 2.4 Cross-Browser Testing
Verify compatibility with:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### 2.5 HTTPS & Security
- [ ] Site is served over HTTPS
- [ ] HTTP → HTTPS redirect is in place
- [ ] No mixed content warnings
- [ ] Security headers configured (see `security-architecture` skill)

### 2.6 Error Handling
- [ ] Custom 404 page exists
- [ ] Graceful error handling for network failures
- [ ] No uncaught exceptions in console
- [ ] Loading states are implemented

---

## Step 3: PWA Checklist (If applicable)

### 3.1 Web App Manifest
Verify `manifest.json` contains:
```json
{
  "name": "App Full Name",
  "short_name": "AppName",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a1a",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 3.2 Service Worker
- [ ] Service worker registered (`navigator.serviceWorker.register`)
- [ ] Offline fallback page works
- [ ] Caching strategy defined (Cache First / Network First)
- [ ] Update mechanism in place

### 3.3 Install Prompt
- [ ] `beforeinstallprompt` event is handled
- [ ] Install button/prompt is visible to users
- [ ] Post-install experience is tested

---

## Step 4: App Store (iOS) Checklist

### 4.1 Build Requirements
- [ ] App uses Xcode ≥ 15 (or Capacitor/React Native equivalent)
- [ ] Targets iOS 16+ minimum
- [ ] Supports all required screen sizes (iPhone SE → Pro Max, iPad)
- [ ] App icon: 1024×1024px PNG, no alpha channel, no rounded corners
- [ ] Launch screen / storyboard configured

### 4.2 App Store Listing
- [ ] App name (≤ 30 chars)
- [ ] Subtitle (≤ 30 chars)
- [ ] Description (up to 4000 chars, first 3 lines matter most)
- [ ] Keywords (100 chars total, comma-separated)
- [ ] Category selected (primary + secondary)
- [ ] Screenshots: 6.7" (1290×2796), 6.5" (1284×2778), 5.5" (1242×2208)
- [ ] iPad screenshots if supporting iPad
- [ ] Preview video (15-30 seconds, optional but recommended)

### 4.3 Privacy & Compliance
- [ ] Privacy Policy URL (required)
- [ ] App Privacy labels completed (data types collected, linked to user, tracking)
- [ ] `NSUserTrackingUsageDescription` if using IDFA
- [ ] `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` (if applicable)
- [ ] Sign in with Apple implemented (if any third-party login is used)
- [ ] GDPR/CCPA compliance for EU/US users

### 4.4 Review Guidelines (Common Rejection Reasons)
- [ ] No placeholder content ("Lorem ipsum", test data)
- [ ] No crashes on launch
- [ ] All links work (Terms, Privacy, Support URL)
- [ ] In-app purchases use Apple's IAP system (no external payment links)
- [ ] No private API usage
- [ ] Minimum functionality met (not just a wrapper for a website)

---

## Step 5: Play Store (Android) Checklist

### 5.1 Build Requirements
- [ ] Target API level ≥ 34 (Android 14)
- [ ] `minSdkVersion` ≥ 24 (Android 7.0) recommended
- [ ] App bundle format (`.aab`, not `.apk`) for Play Store submission
- [ ] App signing by Google Play configured
- [ ] ProGuard/R8 minification enabled for release builds

### 5.2 Play Store Listing
- [ ] App name (≤ 30 chars)
- [ ] Short description (≤ 80 chars)
- [ ] Full description (≤ 4000 chars)
- [ ] High-res icon: 512×512px PNG, 32-bit with alpha
- [ ] Feature graphic: 1024×500px
- [ ] Screenshots: min 2, max 8 per device type (phone, 7" tablet, 10" tablet)
- [ ] App category selected
- [ ] Content rating questionnaire completed
- [ ] Contact email and (optional) website/phone

### 5.3 Data Safety
- [ ] Data safety form completed (what data is collected, shared, security practices)
- [ ] Privacy policy URL provided
- [ ] Data deletion request mechanism (if collecting account data)

### 5.4 Google Play Policies
- [ ] No deceptive behavior
- [ ] Permissions are justified and minimal
- [ ] Sensitive permissions (`CAMERA`, `LOCATION`, `CONTACTS`) require prominent disclosure
- [ ] Background location requires separate review
- [ ] Ads policy compliance (if showing ads)
- [ ] Families policy compliance (if targeting children)

### 5.5 Technical Checks
- [ ] No `android:debuggable="true"` in release manifest
- [ ] No hardcoded API keys in source code
- [ ] Deep links and App Links validated
- [ ] `intent-filter` for URL schemes is correct
- [ ] Adaptive icon with foreground + background layers

---

## Step 6: Final Verification Report

After running all checks, generate a report:

```
╔══════════════════════════════════════════════════╗
║         DEPLOYMENT VERIFICATION REPORT           ║
╠══════════════════════════════════════════════════╣
║ Target:     [Web / PWA / iOS / Android]          ║
║ Date:       [YYYY-MM-DD]                         ║
║ Status:     [✅ READY / ⚠️ ISSUES / ❌ BLOCKED]  ║
╠══════════════════════════════════════════════════╣
║ Performance:    [✅/⚠️/❌] Score: XX/100          ║
║ SEO:            [✅/⚠️/❌] Score: XX/XX           ║
║ Accessibility:  [✅/⚠️/❌] Score: XX/XX           ║
║ Security:       [✅/⚠️/❌] Score: XX/XX           ║
║ Store Readiness: [✅/⚠️/❌] Score: XX/XX          ║
╠══════════════════════════════════════════════════╣
║ 🔴 Blockers:     [count]                         ║
║ 🟡 Warnings:     [count]                         ║
║ 🟢 Passed:       [count]                         ║
╚══════════════════════════════════════════════════╝
```

List all blockers first, then warnings, then passed items.
