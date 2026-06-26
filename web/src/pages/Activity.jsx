import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, UserPlus, MessageCircle, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getInitials, formatTimeAgo } from '../utils/formatters';
import './Activity.css';

const NOTIFICATION_TYPES = {
  like: { icon: Heart, className: 'activity-item__icon--like', verb: 'liked your post' },
  follow: { icon: UserPlus, className: 'activity-item__icon--follow', verb: 'started following you' },
  comment: { icon: MessageCircle, className: 'activity-item__icon--comment', verb: 'commented on your post' },
};

const Activity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const notifRef = collection(db, 'notifications', user.uid, 'items');
      const q = query(notifRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(items);
    } catch {
      // Notifications collection may not exist yet — show empty state
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read
    if (!notif.read) {
      try {
        const notifRef = doc(db, 'notifications', user.uid, 'items', notif.id);
        await updateDoc(notifRef, { read: true });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      } catch {
        /* silent */
      }
    }

    // Navigate based on type
    if (notif.type === 'follow' && notif.fromUsername) {
      navigate(`/user/${notif.fromUsername}`);
    } else if (notif.postId) {
      navigate(`/post/${notif.postId}`);
    }
  };

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  const renderSkeleton = () =>
    Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="activity-skeleton">
        <div className="activity-skeleton__avatar" />
        <div className="activity-skeleton__lines">
          <div className="activity-skeleton__line activity-skeleton__line--long" />
          <div className="activity-skeleton__line activity-skeleton__line--short" />
        </div>
      </div>
    ));

  return (
    <div className="activity-page">
      <header className="activity-page__header">
        <h1>Activity</h1>
      </header>

      {/* Tabs */}
      <div className="activity-page__tabs">
        {['all', 'like', 'follow', 'comment'].map((tab) => (
          <button
            key={tab}
            className={`activity-page__tab ${activeTab === tab ? 'activity-page__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? 'All' : tab === 'like' ? 'Likes' : tab === 'follow' ? 'Follows' : 'Comments'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="page">
        {loading ? (
          renderSkeleton()
        ) : filteredNotifications.length === 0 ? (
          <div className="activity-empty">
            <div className="activity-empty__icon">
              <Bell size={48} strokeWidth={1.25} />
            </div>
            <h3 className="activity-empty__title">
              {activeTab === 'all' ? 'No activity yet' : `No ${activeTab} notifications`}
            </h3>
            <p className="activity-empty__desc">
              When people interact with your posts or follow you, you&apos;ll see it here.
            </p>
          </div>
        ) : (
          <ul className="activity-list stagger-children">
            {filteredNotifications.map((notif) => {
              const typeConfig = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.like;
              const IconComponent = typeConfig.icon;

              return (
                <li key={notif.id}>
                  <button
                    className={`activity-item ${!notif.read ? 'activity-item--unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={`activity-item__icon ${typeConfig.className}`}>
                      <IconComponent size={20} strokeWidth={1.75} />
                    </div>
                    <div className="activity-item__content">
                      <p className="activity-item__text">
                        <strong>{notif.fromDisplayName || 'Someone'}</strong>{' '}
                        {typeConfig.verb}
                        {notif.commentText ? `: "${notif.commentText}"` : ''}
                      </p>
                      {notif.createdAt && (
                        <p className="activity-item__time">
                          {formatTimeAgo(notif.createdAt)}
                        </p>
                      )}
                    </div>
                    {notif.postImageURL && (
                      <img
                        src={notif.postImageURL}
                        alt="Post preview"
                        className="activity-item__preview"
                        loading="lazy"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Activity;
