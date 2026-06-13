import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { getExplorePosts, searchUsers } from '../services/firestore';
import { formatCount, getInitials } from '../utils/formatters';
import './Explore.css';

const Explore = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const result = await getExplorePosts(24);
        setPosts(result.posts);
      } catch (err) {
        console.error('Failed to fetch explore posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(searchTerm.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  return (
    <div className="explore-page">
      {/* Search Bar */}
      <div className="explore-page__search-bar">
        <div className="explore-page__search-input-wrap">
          <Search size={18} strokeWidth={1.75} className="explore-page__search-icon" />
          <input
            type="text"
            className="explore-page__search-input"
            placeholder="Search explorers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="explore-search-input"
          />
          {searchTerm && (
            <button
              className="explore-page__search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="page page--wide">
        {/* Search Results */}
        {searchTerm.trim() && (
          <div className="explore-page__results animate-fadeIn">
            {searching ? (
              <div className="explore-page__results-loading">
                <span className="spinner" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="explore-page__results-empty">
                <p>No trails match "{searchTerm}"</p>
              </div>
            ) : (
              <div className="explore-page__results-list">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    className="explore-page__result-item"
                    onClick={() => navigate(`/user/${user.id}`)}
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="avatar avatar--md" />
                    ) : (
                      <div className="avatar-placeholder avatar--md" style={{ fontSize: '14px' }}>
                        {getInitials(user.displayName)}
                      </div>
                    )}
                    <div className="explore-page__result-info">
                      <span className="explore-page__result-name">{user.displayName}</span>
                      <span className="explore-page__result-handle">@{user.username}</span>
                    </div>
                    <span className="explore-page__result-followers">
                      {formatCount(user.followerCount || 0)} followers
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Explore Grid */}
        {!searchTerm.trim() && (
          <>
            {loading ? (
              <div className="explore-grid">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="skeleton explore-grid__skeleton" />
                ))}
              </div>
            ) : (
              <div className="explore-grid">
                {posts.map((post, i) => (
                  <button
                    key={post.id}
                    className={`explore-grid__item${i % 5 === 0 ? ' explore-grid__item--large' : ''}`}
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <img
                      src={post.imageURLs?.[0]}
                      alt={post.caption || 'Nature'}
                      className="explore-grid__image"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
