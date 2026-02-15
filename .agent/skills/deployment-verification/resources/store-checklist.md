# 📋 Store Submission Checklist Template

Export this checklist to track your store submission progress.

---

## iOS App Store Submission

### Assets
- [ ] App icon 1024×1024 PNG (no alpha, no rounded corners)
- [ ] Screenshots 6.7" (1290×2796) — min 3
- [ ] Screenshots 6.5" (1284×2778) — min 3
- [ ] Screenshots 5.5" (1242×2208) — min 3
- [ ] iPad screenshots (if universal app)
- [ ] Preview video (optional, 15-30s, .mov/.mp4)

### Metadata
- [ ] App name: ______________________________ (≤30 chars)
- [ ] Subtitle: ______________________________ (≤30 chars)
- [ ] Description written (≤4000 chars, compelling first 3 lines)
- [ ] Keywords: ______________________________ (≤100 chars, comma-separated)
- [ ] Primary category: ______________________
- [ ] Secondary category: ____________________
- [ ] Support URL: __________________________
- [ ] Privacy Policy URL: ____________________
- [ ] Marketing URL (optional): ______________

### Compliance
- [ ] App Privacy labels filled (data types, tracking, linked to user)
- [ ] Age rating questionnaire completed
- [ ] IDFA usage declared (if applicable)
- [ ] Export compliance (encryption) declared
- [ ] Sign in with Apple (mandatory if using social logins)
- [ ] GDPR consent mechanism (for EU users)

### Pre-Submission Test
- [ ] No crashes on launch
- [ ] All links functional
- [ ] No placeholder content
- [ ] No references to other platforms ("Android", "Google Play")
- [ ] IAP uses Apple's system (no external payment links)

---

## Google Play Store Submission

### Assets
- [ ] App icon 512×512 PNG (32-bit with alpha)
- [ ] Feature graphic 1024×500 PNG/JPG
- [ ] Screenshots phone (min 2, max 8)
- [ ] Screenshots 7" tablet (if applicable)
- [ ] Screenshots 10" tablet (if applicable)

### Metadata
- [ ] App name: ______________________________ (≤30 chars)
- [ ] Short description: _____________________ (≤80 chars)
- [ ] Full description: (≤4000 chars)
- [ ] Category: ______________________________
- [ ] Contact email: _________________________
- [ ] Privacy Policy URL: ____________________

### Compliance
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] Target audience and content declared
- [ ] Ads declaration (if applicable)
- [ ] Government apps declaration (if applicable)
- [ ] News apps declaration (if applicable)
- [ ] COVID-19 apps declaration (if applicable)

### Technical
- [ ] AAB format (not APK)
- [ ] App signing by Google Play enabled
- [ ] Target API level ≥ 34
- [ ] `debuggable=false` in release
- [ ] ProGuard/R8 enabled
- [ ] Permissions minimized and justified
- [ ] No hardcoded secrets in code

---

## Web Deployment

### Infrastructure
- [ ] Domain registered: ____________________
- [ ] HTTPS certificate configured (Let's Encrypt / Cloudflare)
- [ ] CDN configured (Cloudflare / Vercel Edge)
- [ ] DNS propagation verified
- [ ] HTTP → HTTPS redirect
- [ ] www → non-www (or vice versa) redirect

### Performance
- [ ] Lighthouse score ≥ 90
- [ ] Images optimized (WebP, lazy loading)
- [ ] CSS/JS minified
- [ ] Gzip/Brotli compression enabled
- [ ] Browser caching headers set

### Analytics & Monitoring
- [ ] Google Analytics / Plausible installed
- [ ] Error tracking (Sentry / LogRocket) installed
- [ ] Uptime monitoring configured
- [ ] Core Web Vitals tracked
