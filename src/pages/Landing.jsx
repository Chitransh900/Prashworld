import { useNavigate } from 'react-router-dom';
import { Leaf, Camera, Users, Globe } from 'lucide-react';
import { signInWithGoogle } from '../services/auth';
import { useToast } from '../contexts/ToastContext';
import { APP_NAME, APP_TAGLINE } from '../utils/constants';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/home');
    } catch (err) {
      toast.error('Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="landing">
      {/* Ambient background */}
      <div className="landing__ambient" aria-hidden="true">
        <div className="landing__orb landing__orb--1" />
        <div className="landing__orb landing__orb--2" />
        <div className="landing__orb landing__orb--3" />
      </div>

      <div className="landing__content">
        {/* Hero Section */}
        <header className="landing__hero stagger-children">
          <div className="landing__logo">
            <Leaf size={40} strokeWidth={2} className="landing__logo-icon" />
          </div>
          <h1 className="landing__title">{APP_NAME}</h1>
          <p className="landing__tagline">{APP_TAGLINE}</p>
          <p className="landing__subtitle">
            The social platform built for ecologists, wildlife photographers,
            and everyone who finds wonder in the natural world.
          </p>
        </header>

        {/* Auth Buttons */}
        <div className="landing__auth stagger-children">
          <button
            className="btn btn--google btn--lg btn--full"
            onClick={handleGoogleSignIn}
            id="google-signin-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider-text">or</div>

          <button
            className="btn btn--primary btn--lg btn--full"
            onClick={() => navigate('/login')}
            id="email-signin-btn"
          >
            Sign in with Email
          </button>

          <p className="landing__signup-link">
            New to the wild?{' '}
            <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>
              Create your field journal
            </a>
          </p>
        </div>

        {/* Features */}
        <div className="landing__features stagger-children">
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Camera size={22} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="landing__feature-title">Share Nature Moments</h3>
              <p className="landing__feature-desc">
                Document biodiversity with stunning nature photography
              </p>
            </div>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Users size={22} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="landing__feature-title">Join the Ecology Network</h3>
              <p className="landing__feature-desc">
                Connect with field researchers and wildlife enthusiasts
              </p>
            </div>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Globe size={22} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="landing__feature-title">Inspire Conservation</h3>
              <p className="landing__feature-desc">
                Every post amplifies the voice of the natural world
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="landing__footer">
        <p>© 2026 {APP_NAME}. For the wild, by the wild.</p>
      </footer>
    </div>
  );
};

export default Landing;
