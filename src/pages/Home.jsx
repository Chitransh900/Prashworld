import { useState, useEffect, useCallback } from 'react';
import { Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getExplorePosts } from '../services/firestore';
import PostCard from '../components/feed/PostCard';
import { APP_NAME } from '../utils/constants';
import './Home.css';

const Home = () => {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const result = await getExplorePosts(10);
      setPosts(result.posts);
      setLastDoc(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getExplorePosts(10, lastDoc);
      setPosts((prev) => [...prev, ...result.posts]);
      setLastDoc(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        loadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, lastDoc]);

  return (
    <div className="home-page">
      {/* Top Bar (Mobile) */}
      <header className="home-page__topbar">
        <div className="home-page__topbar-logo">
          <Leaf size={22} strokeWidth={2} className="home-page__topbar-icon" />
          <span className="home-page__topbar-title">{APP_NAME}</span>
        </div>
      </header>

      <div className="home-page__feed page">
        {loading ? (
          <div className="home-page__skeletons stagger-children">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="post-skeleton">
                <div className="post-skeleton__header">
                  <div className="skeleton skeleton--circle" style={{ width: 40, height: 40 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton--text" style={{ width: '40%' }} />
                    <div className="skeleton skeleton--text" style={{ width: '25%' }} />
                  </div>
                </div>
                <div className="skeleton" style={{ width: '100%', aspectRatio: '4/5' }} />
                <div style={{ padding: '12px 16px' }}>
                  <div className="skeleton skeleton--text" style={{ width: '30%' }} />
                  <div className="skeleton skeleton--text" style={{ width: '90%' }} />
                  <div className="skeleton skeleton--text" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="home-page__empty animate-fadeInUp">
            <div className="home-page__empty-icon">🌿</div>
            <h2 className="home-page__empty-title">Your trail is quiet</h2>
            <p className="home-page__empty-desc">
              Follow ecologists and nature photographers to see the wild world come alive in your feed.
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
            ))}
            {loadingMore && (
              <div className="home-page__loading-more">
                <span className="spinner" />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="home-page__end-text">You've reached the end of the trail 🌄</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
