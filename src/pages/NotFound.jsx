import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found animate-fadeInUp">
      <Compass size={64} strokeWidth={1} className="not-found__icon" />
      <h1 className="not-found__title">Trail not found</h1>
      <p className="not-found__desc">
        This path doesn't exist. Let's head back to familiar terrain.
      </p>
      <button className="btn btn--primary" onClick={() => navigate('/home')}>
        Return to Camp
      </button>
    </div>
  );
};

export default NotFound;
