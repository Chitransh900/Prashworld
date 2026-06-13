import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { likePost, unlikePost, deletePost } from '../../services/firestore';
import { formatTimeAgo, formatCount, getInitials, getPostURL } from '../../utils/formatters';
import './PostCard.css';

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.uid));
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const handleLike = useCallback(async () => {
    if (!user) return;
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 500);

    if (isLiked) {
      setIsLiked(false);
      setLikeCount((c) => c - 1);
      try {
        await unlikePost(post.id, user.uid);
      } catch {
        setIsLiked(true);
        setLikeCount((c) => c + 1);
      }
    } else {
      setIsLiked(true);
      setLikeCount((c) => c + 1);
      try {
        await likePost(post.id, user.uid);
      } catch {
        setIsLiked(false);
        setLikeCount((c) => c - 1);
      }
    }
  }, [isLiked, post.id, user]);

  const handleShare = async () => {
    const url = getPostURL(post.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.authorName} on Prashworld`,
          text: post.caption?.slice(0, 100) || 'Check out this nature post',
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deletePost(post.id, post.authorId);
      toast.success('Post deleted');
      onDelete?.(post.id);
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Failed to delete post'}`);
    }
    setShowMenu(false);
  };

  const images = post.imageURLs || [];
  const isOwnPost = user?.uid === post.authorId;
  const caption = post.caption || '';
  const shouldTruncate = caption.length > 150 && !captionExpanded;

  return (
    <article className="post-card animate-fadeInUp">
      {/* Author Header */}
      <header className="post-card__header">
        <div
          className="post-card__author"
          onClick={() => navigate(`/user/${post.authorUsername}`)}
          role="button"
          tabIndex={0}
        >
          {post.authorPhotoURL ? (
            <img
              src={post.authorPhotoURL}
              alt={post.authorName}
              className="avatar avatar--md"
            />
          ) : (
            <div className="avatar-placeholder avatar--md" style={{ fontSize: '14px' }}>
              {getInitials(post.authorName)}
            </div>
          )}
          <div className="post-card__author-info">
            <span className="post-card__author-name">{post.authorName}</span>
            {post.location && (
              <span className="post-card__location">
                <MapPin size={12} strokeWidth={2} />
                {post.location}
              </span>
            )}
          </div>
        </div>

        {isOwnPost && (
          <div className="post-card__menu-wrapper">
            <button
              className="post-card__menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Post options"
            >
              <MoreHorizontal size={20} strokeWidth={1.75} />
            </button>
            {showMenu && (
              <div className="post-card__menu">
                <button className="post-card__menu-item post-card__menu-item--danger" onClick={handleDelete}>
                  <Trash2 size={16} />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Image */}
      {images.length > 0 && (
        <div className="post-card__image-container">
          <img
            src={images[currentImageIndex]}
            alt={post.caption || 'Nature photograph'}
            className="post-card__image"
            loading="lazy"
            onDoubleClick={handleLike}
          />
          {images.length > 1 && (
            <div className="post-card__image-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`post-card__image-dot${i === currentImageIndex ? ' post-card__image-dot--active' : ''}`}
                  onClick={() => setCurrentImageIndex(i)}
                  aria-label={`View image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="post-card__actions">
        <div className="post-card__actions-left">
          <button
            className={`post-card__action-btn post-card__like-btn${isLiked ? ' post-card__like-btn--active' : ''}${likeAnimating ? ' post-card__like-btn--animating' : ''}`}
            onClick={handleLike}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={22}
              strokeWidth={isLiked ? 0 : 1.75}
              fill={isLiked ? 'var(--color-like)' : 'none'}
            />
          </button>
          <button
            className="post-card__action-btn"
            onClick={() => navigate(`/post/${post.id}`)}
            aria-label="Comments"
          >
            <MessageCircle size={22} strokeWidth={1.75} />
          </button>
          <button
            className="post-card__action-btn"
            onClick={handleShare}
            aria-label="Share"
          >
            <Share2 size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Like count */}
      {likeCount > 0 && (
        <div className="post-card__likes">
          {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div className="post-card__caption">
          <span className="post-card__caption-author">{post.authorName}</span>{' '}
          <span className="post-card__caption-text">
            {shouldTruncate ? caption.slice(0, 150) + '...' : caption}
          </span>
          {shouldTruncate && (
            <button
              className="post-card__caption-more"
              onClick={() => setCaptionExpanded(true)}
            >
              more
            </button>
          )}
        </div>
      )}

      {/* Comment count */}
      {post.commentCount > 0 && (
        <button
          className="post-card__view-comments"
          onClick={() => navigate(`/post/${post.id}`)}
        >
          View all {post.commentCount} comments
        </button>
      )}

      {/* Timestamp */}
      <time className="post-card__time">{formatTimeAgo(post.createdAt)}</time>
    </article>
  );
};

export default PostCard;
