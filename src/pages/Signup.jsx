import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Leaf } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '../services/auth';
import { useToast } from '../contexts/ToastContext';
import './AuthPages.css';

const Signup = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!displayName.trim()) errs.displayName = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'At least 6 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords don\'t match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signUpWithEmail(email, password, displayName.trim());
      toast.success('Welcome to the wild! 🌿');
      navigate('/home');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists');
      } else if (err.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/home');
    } catch {
      toast.error('Google sign-in failed');
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '' };
    if (password.length < 6) return { level: 1, label: 'Weak' };
    if (password.length < 10) return { level: 2, label: 'Fair' };
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { level: 4, label: 'Strong' };
    return { level: 3, label: 'Good' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="auth-page">
      <div className="auth-page__card animate-fadeInUp">
        <button className="auth-page__back" onClick={() => navigate('/')} aria-label="Go back">
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>

        <div className="auth-page__header">
          <div className="auth-page__logo">
            <Leaf size={24} strokeWidth={2} />
          </div>
          <h1 className="auth-page__title">Start your field journal</h1>
          <p className="auth-page__subtitle">Join the ecology network</p>
        </div>

        <form className="auth-page__form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="signup-name">Display Name</label>
            <input
              id="signup-name"
              type="text"
              className={`input${errors.displayName ? ' input--error' : ''}`}
              placeholder="Sarah Chen"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
            {errors.displayName && <span className="input-error-text">{errors.displayName}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className={`input${errors.email ? ' input--error' : ''}`}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && <span className="input-error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className={`input${errors.password ? ' input--error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {strength.level > 0 && (
              <div className="password-strength">
                <div className="password-strength__bar">
                  <div
                    className={`password-strength__fill password-strength__fill--${strength.level}`}
                    style={{ width: `${strength.level * 25}%` }}
                  />
                </div>
                <span className={`password-strength__label password-strength__label--${strength.level}`}>
                  {strength.label}
                </span>
              </div>
            )}
            {errors.password && <span className="input-error-text">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              className={`input${errors.confirmPassword ? ' input--error' : ''}`}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="input-error-text">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg btn--full"
            disabled={loading}
            id="signup-submit-btn"
          >
            {loading ? <span className="spinner spinner--sm" /> : 'Create Account'}
          </button>
        </form>

        <div className="divider-text">or</div>

        <button
          className="btn btn--google btn--lg btn--full"
          onClick={handleGoogleSignIn}
          id="signup-google-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-page__switch">
          Already exploring?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
