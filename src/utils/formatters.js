/**
 * Format a Firestore timestamp to relative time
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Format a number (e.g., 1200 → "1.2K")
 */
export const formatCount = (num) => {
  if (!num || num < 0) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
};

/**
 * Get initials from a display name (for avatar placeholder)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Generate a shareable profile URL
 */
export const getProfileURL = (username) => {
  return `${window.location.origin}/user/${username}`;
};

/**
 * Generate a shareable post URL
 */
export const getPostURL = (postId) => {
  return `${window.location.origin}/post/${postId}`;
};
