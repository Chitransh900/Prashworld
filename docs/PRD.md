# Prashworld — Product Requirements Document (PRD)

> **Version:** 1.0 | **Last Updated:** 2026-06-13 | **Status:** Active Development

## Product Vision
**Prashworld** is a nature-first social platform for ecologists, wildlife photographers, conservationists, and nature lovers. Tagline: *"Where Nature Finds Its Voice"*

## Target Users
| Persona | Need |
|---------|------|
| Field Ecologist | Share findings, build professional profile |
| Wildlife Photographer | Showcase portfolio, gain recognition |
| Nature Enthusiast | Discover content, connect with community |
| Conservation Activist | Amplify messages, build following |

## Core Features (MVP)
1. **Auth** — Google Sign-In + Email/Password via Firebase
2. **User Profile** — Name, username, avatar, bio, location, stats
3. **Post Creation** — Upload photos (1-5), caption, location, species tag
4. **Feed** — Chronological feed, explore/discover, infinite scroll
5. **Interactions** — Like, comment, share, save
6. **Follow System** — Follow/unfollow, follower/following lists
7. **Search** — Users by name/username, explore trending content
8. **Profile Sharing** — Shareable URL, Web Share API

## Non-Functional Requirements
- FCP < 1.5s, TTI < 3s
- WCAG 2.1 AA
- Mobile-first (320px–1440px+)
- Firebase Auth + Firestore security rules

## Out of Scope (Phase 1)
DMs, Stories, Video, Monetization, Push notifications, AI species ID, Admin dashboard
