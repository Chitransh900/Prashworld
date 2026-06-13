import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getPostById, likePost, unlikePost, addComment, getComments, deleteComment } from '../services/firestore';
import { formatTimeAgo, getInitials } from '../utils/formatters';
import './PostDetail.css';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostById(postId);
        if (!postData) {
          navigate('/home');
          return;
        }
        setPost(postData);
        setIsLiked(postData.likes?.includes(user?.uid));
        setLikeCount(postData.likeCount || 0);

        const commentsData = await getComments(postId);
        setComments(commentsData);
      } catch (err) {
        console.error('Failed to fetch post:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, user, navigate]);

  const handleLike = async () => {
    if (!user) return;
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((c) => c - 1);
      await unlikePost(postId, user.uid).catch(() => {
        setIsLiked(true);
        setLikeCount((c) => c + 1);
      });
    } else {
      setIsLiked(true);
      setLikeCount((c) => c + 1);
      await likePost(postId, user.uid).catch(() => {
        setIsLiked(false);
        setLikeCount((c) => c - 1);
      });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const newComment = await addComment(postId, {
        authorId: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'Explorer',
        authorUsername: userProfile?.username || '',
        authorPhotoURL: userProfile?.photoURL || user.photoURL || null,
        text: commentText.trim(),
      });
      setComments((prev) => [...prev, { ...newComment, createdAt: new Date() }]);
      setCommentText('');
      setPost((p) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((p) => ({ ...p, commentCount: (p.commentCount || 1) - 1 }));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="post-detail">
        <div className="post-detail__loading"><span className="spinner spinner--lg" /></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="post-detail">
      <header className="post-detail__topbar">
        <button className="post-detail__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <span className="post-detail__topbar-title">Post</span>
        <div style={{ width: 36 }} />
      </header>

      <div className="post-detail__content">
        {/* Image */}
        <div className="post-detail__image-wrap">
          <img src={post.imageURLs?.[0]} alt={post.caption || 'Nature'} className="post-detail__image" />
        </div>

        {/* Author + Actions */}
        <div className="post-detail__info">
          <div className="post-detail__author" onClick={() => navigate(`/user/${post.authorUsername}`)} role="button" tabIndex={0}>
            {post.authorPhotoURL ? (
              <img src={post.authorPhotoURL} alt={post.authorName} className="avatar avatar--md" />
            ) : (
              <div className="avatar-placeholder avatar--md" style={{ fontSize: '14px' }}>{getInitials(post.authorName)}</div>
            )}
            <div>
              <span className="post-detail__author-name">{post.authorName}</span>
              {post.location && <span className="post-detail__location">{post.location}</span>}
            </div>
          </div>

          <div className="post-detail__actions">
            <button className={`post-detail__like-btn${isLiked ? ' post-detail__like-btn--active' : ''}`} onClick={handleLike}>
              <Heart size={22} strokeWidth={isLiked ? 0 : 1.75} fill={isLiked ? 'var(--color-like)' : 'none'} />
              <span>{likeCount}</span>
            </button>
          </div>

          {post.caption && (
            <p className="post-detail__caption">
              <strong>{post.authorName}</strong> {post.caption}
            </p>
          )}

          <span className="post-detail__time">{formatTimeAgo(post.createdAt)}</span>

          <hr className="divider" />

          {/* Comments */}
          <div className="post-detail__comments">
            {comments.length === 0 ? (
              <p className="post-detail__no-comments">No comments yet. Start the conversation.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment animate-fadeInUp">
                  <div className="comment__author" onClick={() => navigate(`/user/${comment.authorUsername}`)} role="button" tabIndex={0}>
                    {comment.authorPhotoURL ? (
                      <img src={comment.authorPhotoURL} alt={comment.authorName} className="avatar avatar--xs" />
                    ) : (
                      <div className="avatar-placeholder avatar--xs" style={{ fontSize: '10px' }}>{getInitials(comment.authorName)}</div>
                    )}
                  </div>
                  <div className="comment__body">
                    <p>
                      <strong className="comment__name">{comment.authorName}</strong>{' '}
                      {comment.text}
                    </p>
                    <span className="comment__time">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  {comment.authorId === user?.uid && (
                    <button className="comment__delete" onClick={() => handleDeleteComment(comment.id)} aria-label="Delete comment">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <form className="post-detail__comment-form" onSubmit={handleAddComment}>
        <input
          type="text"
          className="post-detail__comment-input"
          placeholder="Add a field note..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          maxLength={500}
          id="comment-input"
        />
        <button
          type="submit"
          className="post-detail__comment-send"
          disabled={!commentText.trim() || submitting}
          aria-label="Send comment"
        >
          <Send size={18} strokeWidth={2} />
        </button>
      </form>
    </div>
  );
};

export default PostDetail;
