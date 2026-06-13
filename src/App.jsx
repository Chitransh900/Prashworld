import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AppShell from './components/layout/AppShell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Explore from './pages/Explore';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { Leaf } from 'lucide-react';

/**
 * Protected Route wrapper — redirects to landing if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="page-loader__logo">
          <Leaf size={40} strokeWidth={2} style={{ color: 'var(--color-primary-500)' }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Public Route wrapper — redirects to home if already authenticated
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="page-loader__logo">
          <Leaf size={40} strokeWidth={2} style={{ color: 'var(--color-primary-500)' }} />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Protected Routes (inside AppShell) */}
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/home" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/activity" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:username" element={<Profile />} />
              <Route path="/post/:postId" element={<PostDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/profile" element={<EditProfile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
