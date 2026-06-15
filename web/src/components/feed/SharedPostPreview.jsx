import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPostById } from '../../services/firestore';
import './SharedPostPreview.css';

export default function SharedPostPreview({ postId }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPostById(postId);
        setPost(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (postId) fetchPost();
  }, [postId]);

  if (loading) return <div className="shared-post-loading"><span className="spinner spinner--small" /></div>;
  if (!post) return <div className="shared-post-error">Post not found</div>;

  return (
    <div className="shared-post-preview" onClick={() => navigate(`/post/${postId}`)}>
      {post.imageURLs && post.imageURLs.length > 0 && (
        <img src={post.imageURLs[0]} alt="Post preview" className="shared-post-image" />
      )}
      <div className="shared-post-details">
        <span className="shared-post-author">{post.authorName}</span>
        {post.caption && <span className="shared-post-caption">{post.caption.slice(0, 50)}{post.caption.length > 50 ? '...' : ''}</span>}
      </div>
    </div>
  );
}
