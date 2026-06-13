import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Share2, Grid3X3, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getUserByUsername, getUserById, getUserPosts, checkIsFollowing, followUser, unfollowUser } from '../services/firestore';
import { formatCount, getInitials, getProfileURL } from '../utils/formatters';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isOwnProfile = !username || (userProfile && userProfile.username === username);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        let profileData;
        if (isOwnProfile) {
          profileData = userProfile;
        } else {
          profileData = await getUserByUsername(username);
        }

        if (!profileData) {
          navigate('/home');
          return;
        }

        setProfile(profileData);

        // Fetch posts
        const result = await getUserPosts(profileData.uid || profileData.id);
        setPosts(result.posts);

        // Check following status
        const targetId = profileData.uid || profileData.id;
        if (user && !isOwnProfile && targetId) {
          const following = await checkIsFollowing(user.uid, targetId);
          setIsFollowing(following);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, userProfile, user, isOwnProfile, navigate]);

  const handleFollow = async () => {
    if (!user || !profile || followLoading) return;
    setFollowLoading(true);

    const targetId = profile.uid || profile.id;

    try {
      if (isFollowing) {
        await unfollowUser(user.uid, targetId);
        setIsFollowing(false);
        setProfile((p) => ({ ...p, followerCount: (p.followerCount || 1) - 1 }));
      } else {
        await followUser(
          { uid: user.uid, displayName: userProfile?.displayName, username: userProfile?.username, photoURL: userProfile?.photoURL },
          targetId,
          profile
        );
        setIsFollowing(true);
        setProfile((p) => ({ ...p, followerCount: (p.followerCount || 0) + 1 }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Action failed. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const url = getProfileURL(profile?.username || username);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.displayName} on Prashworld`,
          text: profile?.bio || 'Check out this explorer on Prashworld',
          url,
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-page__loading">
          <span className="spinner spinner--lg" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="profile-page">
      {/* Header */}
      {!isOwnProfile && (
        <header className="profile-page__topbar">
          <button className="profile-page__back" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={22} strokeWidth={1.75} />
          </button>
          <span className="profile-page__topbar-name">{profile.displayName}</span>
          <div style={{ width: 36 }} />
        </header>
      )}

      <div className="page">
        {/* Profile Header */}
        <div className="profile-header animate-fadeInUp">
          <div className="profile-header__top">
            {/* Avatar */}
            <div className="profile-header__avatar-wrap">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="avatar avatar--xl" />
              ) : (
                <div className="avatar-placeholder avatar--xl" style={{ fontSize: '28px' }}>
                  {getInitials(profile.displayName)}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="profile-header__stats">
              <div className="profile-header__stat">
                <span className="profile-header__stat-value">{formatCount(profile.postCount || 0)}</span>
                <span className="profile-header__stat-label">posts</span>
              </div>
              <div className="profile-header__stat">
                <span className="profile-header__stat-value">{formatCount(profile.followerCount || 0)}</span>
                <span className="profile-header__stat-label">followers</span>
              </div>
              <div className="profile-header__stat">
                <span className="profile-header__stat-value">{formatCount(profile.followingCount || 0)}</span>
                <span className="profile-header__stat-label">following</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="profile-header__bio">
            <h1 className="profile-header__name">{profile.displayName}</h1>
            <span className="profile-header__username">@{profile.username}</span>
            {profile.bio && <p className="profile-header__bio-text">{profile.bio}</p>}
            {profile.location && (
              <span className="profile-header__location">
                <MapPin size={14} strokeWidth={2} />
                {profile.location}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="profile-header__actions">
            {isOwnProfile ? (
              <>
                <button
                  className="btn btn--secondary btn--full"
                  onClick={() => navigate('/settings/profile')}
                  id="edit-profile-btn"
                >
                  Edit Profile
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={handleShare}
                  aria-label="Share profile"
                >
                  <Share2 size={18} strokeWidth={1.75} />
                </button>
              </>
            ) : (
              <>
                <button
                  className={`btn btn--full ${isFollowing ? 'btn--secondary' : 'btn--primary'}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                  id="follow-btn"
                >
                  {followLoading ? (
                    <span className="spinner spinner--sm" />
                  ) : isFollowing ? (
                    'Following'
                  ) : (
                    'Follow'
                  )}
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={handleShare}
                  aria-label="Share profile"
                >
                  <Share2 size={18} strokeWidth={1.75} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Post Grid */}
        <div className="profile-page__tabs">
          <button className="profile-page__tab profile-page__tab--active">
            <Grid3X3 size={18} strokeWidth={1.75} />
            <span>Posts</span>
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="profile-page__empty animate-fadeInUp">
            <div className="profile-page__empty-icon">📸</div>
            <h3 className="profile-page__empty-title">
              {isOwnProfile ? 'No field notes yet' : 'No posts yet'}
            </h3>
            <p className="profile-page__empty-desc">
              {isOwnProfile
                ? 'Share your first nature moment with the world.'
                : 'This explorer hasn\'t shared any field notes yet.'}
            </p>
            {isOwnProfile && (
              <button
                className="btn btn--primary"
                onClick={() => navigate('/create')}
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
          <div className="profile-grid">
            {posts.map((post) => (
              <button
                key={post.id}
                className="profile-grid__item"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <img
                  src={post.imageURLs?.[0]}
                  alt={post.caption || 'Post'}
                  className="profile-grid__image"
                  loading="lazy"
                />
                <div className="profile-grid__overlay">
                  <span>❤️ {formatCount(post.likeCount || 0)}</span>
                  <span>💬 {formatCount(post.commentCount || 0)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
