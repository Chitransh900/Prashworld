# Prashworld — Technical Specification

> **Version:** 1.0 | **Last Updated:** 2026-06-13 | **Status:** Active Development

## Architecture
SPA (Vite + React) → Firebase SDK → Firebase Auth + Firestore + Storage. Deployed on Netlify.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Build Tool | Vite 6.x |
| UI Framework | React 19.x |
| Routing | React Router 7.x |
| Styling | Vanilla CSS (custom properties) |
| Auth | Firebase Auth 11.x |
| Database | Cloud Firestore |
| File Storage | Firebase Storage |
| Hosting | Netlify |
| Icons | Lucide React |
| Image Processing | browser-image-compression |

## Firebase Project
- **Project ID:** `prashworld-4897b`
- **Storage Bucket:** `prashworld-4897b.firebasestorage.app`

## State Management
React Context + useReducer: `AuthContext` (user/auth state), `ToastContext` (notifications)

## Image Pipeline
1. User selects image → 2. Client-side compression (WebP, <500KB) → 3. Upload to Storage → 4. Store URL in Firestore

## Performance Targets
Lighthouse > 90, FCP < 1.5s, LCP < 2.5s, Bundle < 300KB gzipped

## Security
Firestore rules enforce ownership. Storage rules enforce auth + file type/size. No sensitive data in localStorage.
