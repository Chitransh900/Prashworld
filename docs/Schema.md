# Prashworld — Database Schema

> **Version:** 1.0 | **Last Updated:** 2026-06-13 | **Database:** Cloud Firestore

## Collections

### `users/{userId}`
uid, email, displayName, username, photoURL, coverURL, bio, location, postCount, followerCount, followingCount, authProvider, createdAt, updatedAt

### `users/{userId}/followers/{followerId}`
uid, username, displayName, photoURL, followedAt

### `users/{userId}/following/{followingId}`
uid, username, displayName, photoURL, followedAt

### `posts/{postId}`
postId, authorId, authorName, authorUsername, authorPhotoURL, imageURLs[], caption, location, geoPoint, speciesTag, likes[], likeCount, commentCount, createdAt, updatedAt, isEdited

### `posts/{postId}/comments/{commentId}`
commentId, authorId, authorName, authorUsername, authorPhotoURL, text, createdAt

### `usernames/{username}`
uid (for unique username enforcement)

## Storage
- `avatars/{userId}/profile.webp`
- `covers/{userId}/cover.webp`
- `posts/{userId}/{timestamp}_{random}.webp`

## Security Rules
- Users can only write own profile
- Posts only editable/deletable by author (except likes/comments)
- All reads are public
- Storage: auth required, max 10MB, image types only

## Denormalization
Author info duplicated in posts and comments for fast reads.
