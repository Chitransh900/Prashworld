import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Moon, Sun, LogOut, Trash2, Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { signOut } from '../services/auth';
import { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const toast = useToast();
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('prashworld-theme', newTheme);
    setIsDark(!isDark);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <button className="settings-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="settings-page__title">Settings</h1>
        <div style={{ width: 36 }} />
      </header>

      <div className="page settings-page__content">
        <div className="settings-page__section">
          <h2 className="settings-page__section-title">Account</h2>
          <button
            className="settings-page__item"
            onClick={() => navigate('/settings/profile')}
          >
            <User size={20} strokeWidth={1.75} />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="settings-page__section">
          <h2 className="settings-page__section-title">Appearance</h2>
          <button className="settings-page__item" onClick={toggleTheme}>
            {isDark ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            <div className={`settings-page__toggle${isDark ? ' settings-page__toggle--active' : ''}`}>
              <div className="settings-page__toggle-knob" />
            </div>
          </button>
        </div>

        <div className="settings-page__section">
          <button className="settings-page__item settings-page__item--danger" onClick={handleSignOut}>
            <LogOut size={20} strokeWidth={1.75} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="settings-page__footer">
          <Leaf size={20} className="settings-page__footer-icon" />
          <p>Prashworld v1.0.0</p>
          <p>For the wild, by the wild.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
