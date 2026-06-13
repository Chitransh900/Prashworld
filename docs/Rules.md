# Prashworld — Development Rules

> **Version:** 1.0 | **Last Updated:** 2026-06-13

## Code Rules
- Functional components only, arrow functions, destructured props
- No console.log in production, no commented-out code, no magic numbers
- No inline styles — all styling via CSS classes
- Components < 150 lines; extract hooks/sub-components if larger
- Always handle loading, error, and empty states

## CSS Rules
- Use CSS custom properties (design tokens) for ALL colors, spacing, radii, shadows
- BEM-style naming: `.post-card`, `.post-card__header`, `.post-card--featured`
- Mobile-first media queries (min-width)
- Component styles co-located (PostCard.css next to PostCard.jsx)

## File Naming
- Components: PascalCase (PostCard.jsx)
- Hooks: camelCase with `use` prefix (useAuth.js)
- Services: camelCase (auth.js, firestore.js)

## Firebase Rules
- .env never committed to git
- Use batch writes for multi-document operations
- Paginate all list queries
- Use serverTimestamp() for all timestamps
- Compress images client-side before upload

## Git Rules
- Conventional commits: `feat:`, `fix:`, `style:`, `docs:`, `refactor:`, `chore:`
- Feature branches: `feature/{name}`, bug fixes: `fix/{name}`
- .gitignore: node_modules, dist, .env, logs

## Accessibility
- All images: alt text; all buttons: aria-label
- Keyboard accessible; focus styles visible
- Color contrast WCAG 2.1 AA (4.5:1)
- Semantic HTML: nav, main, article, section

## Design Rules
- Never use generic colors — always design tokens
- All spacing from scale; all radii from scale; all shadows from scale
- Buttons must have hover, active, focus states
- Loading = skeleton screens (not spinners)
- Empty states = helpful messages + CTAs
