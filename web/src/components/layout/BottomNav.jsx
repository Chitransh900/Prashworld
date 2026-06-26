import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Heart, User, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/explore', icon: Search, label: 'Explore' },
    { path: '/create', icon: PlusCircle, label: 'Create', isCreate: true },
    { path: '/gallery', icon: Sparkles, label: 'Gallery' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  // Hide BottomNav when inside a specific chat thread
  if (location.pathname.startsWith('/messages/') && location.pathname.length > '/messages/'.length) {
    return null;
  }

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(({ path, icon: Icon, label, isCreate }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}${isCreate ? ' bottom-nav__item--create' : ''}`
          }
          aria-label={label}
        >
          <Icon size={isCreate ? 28 : 22} strokeWidth={1.75} />
          {!isCreate && <span className="bottom-nav__label">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
