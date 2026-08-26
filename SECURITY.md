# 🛡️ AniTrace AI - Security & Privacy Policy

This document outlines the security architecture, threat model, and privacy protections embedded within **AniTrace AI 2.0**.

---

## 🔒 1. Privacy-First Architecture

* **Zero Cloud Image Storage:** Uploaded screenshots, direct URLs, and clipboard image data are processed strictly in-memory and in client-side IndexedDB (`localforage`).
* **Zero Telemetry / Trackers:** No tracking pixels, Google Analytics, or third-party behavioral analytics trackers are bundled into the application.
* **On-Device Vector Computation:** 75-dimensional cosine similarity embeddings are calculated locally in JavaScript using `Float32Array` vectors — never sent to third-party vector databases.

---

## 🌐 2. Content Security Policy (CSP)

Configured via strict `<meta http-equiv="Content-Security-Policy">` headers:

```http
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https: http:;
media-src 'self' blob: https: http:;
connect-src 'self' https://graphql.anilist.co https://api.trace.moe https://corsproxy.io https://*.anilist.co;
frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
```

---

## 🧼 3. Input Sanitization & XSS Prevention

* **HTML Sanitization (`src/lib/sanitize.ts`):** Strips `<script>`, `<iframe>`, `<object>`, and dangerous inline event handlers (`onerror`, `onclick`, `onload`) before rendering synopses.
* **URL Scheme Validation (`isSafeUrl`):** Rejects `javascript:`, `data:`, `file:`, and `vbscript:` schemes to prevent malicious execution upon image scan requests.
* **Backup Schema Validation:** JSON import parser (`importHistoryJSON`) verifies schema structure and string constraints to prevent Prototype Pollution attacks.

---

## ⚖️ 4. Multi-Endpoint Load Balancing & Rate Limiting

* **Failover Engine (`ServiceLoadBalancer`):** Automatically detects network timeouts and HTTP 429 rate limit exceptions, placing exhausted nodes in a 30-second cooldown period while rerouting traffic to healthy mirrors.
