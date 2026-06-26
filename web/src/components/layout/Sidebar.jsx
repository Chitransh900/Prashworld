import { NavLink } from 'react-router-dom';
import { Home, Search, PlusCircle, Heart, User, Settings, LogOut, Leaf, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../services/auth';
import { useToast } from '../../contexts/ToastContext';
import { APP_NAME } from '../../utils/constants';
import './Sidebar.css';

const Sidebar = () => {
  const { userProfile } = useAuth();
  const toast = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/explore', icon: Search, label: 'Explore' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/gallery', icon: Sparkles, label: 'Smart Gallery' },
    { path: '/create', icon: PlusCircle, label: 'New Post' },
    { path: '/activity', icon: Heart, label: 'Activity' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar__logo">
        <Leaf size={28} strokeWidth={2} className="sidebar__logo-icon" />
        <span className="sidebar__logo-text">{APP_NAME}</span>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <Icon size={22} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        {userProfile && (
          <div className="sidebar__user">
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                className="avatar avatar--sm"
              />
            ) : (
              <div className="avatar-placeholder avatar--sm" style={{ fontSize: '12px' }}>
                {userProfile.displayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="sidebar__user-info">
              <span className="sidebar__user-name truncate">{userProfile.displayName}</span>
              <span className="sidebar__user-handle truncate">@{userProfile.username}</span>
            </div>
          </div>
        )}
        <button className="sidebar__signout" onClick={handleSignOut} aria-label="Sign out">
          <LogOut size={18} strokeWidth={1.75} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
