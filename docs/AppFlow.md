# Prashworld — Application Flow

> **Version:** 1.0 | **Last Updated:** 2026-06-13

## Navigation
- **Not authenticated** → Landing → Login/Signup → Home
- **Authenticated** → Home Feed (default)

## Routes
| Route | Page | Auth |
|-------|------|------|
| `/` | Landing | Public (redirect if authed) |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/home` | Home Feed | Protected |
| `/explore` | Explore/Search | Protected |
| `/create` | New Post | Protected |
| `/profile` | Own Profile | Protected |
| `/user/:username` | User Profile | Protected |
| `/post/:postId` | Post Detail | Protected |
| `/settings` | Settings | Protected |
| `/settings/profile` | Edit Profile | Protected |

## Bottom Nav (Mobile <1024px)
Home | Explore | Create | Activity | Profile

## Sidebar (Desktop ≥1024px)
Logo + Home, Explore, New Post, Activity, Profile, Settings + User info + Sign out

## Key Flows
1. **Signup** → Form → createUserWithEmailAndPassword → Create Firestore profile → Home
2. **Google Sign-In** → signInWithPopup → Create profile if new → Home
3. **Create Post** → Select images → Add caption/location → Upload → Home
4. **Like** → Optimistic UI → arrayUnion → Heart animation
5. **Follow** → Batch write (2 subcollections + 2 counts)
6. **Share Profile** → Web Share API or clipboard copy
