import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { updateUserProfile } from '../services/firestore';
import { uploadAvatar } from '../services/storage';
import { getInitials } from '../utils/formatters';
import { MAX_BIO_LENGTH } from '../utils/constants';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, userProfile, refreshProfile } = useAuth();
  const toast = useToast();
  const avatarInputRef = useRef(null);

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [location, setLocation] = useState(userProfile?.location || '');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.warning('Display name is required');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
      };

      // Upload new avatar if changed
      if (avatarFile) {
        const photoURL = await uploadAvatar(user.uid, avatarFile);
        updates.photoURL = photoURL;
      }

      await updateUserProfile(user.uid, updates);
      await refreshProfile();
      toast.success('Profile updated');
      navigate('/profile');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-profile-page">
      <header className="edit-profile-page__header">
        <button className="edit-profile-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="edit-profile-page__title">Edit Profile</h1>
        <button
          className="btn btn--primary btn--sm btn--pill"
          onClick={handleSave}
          disabled={saving}
          id="save-profile-btn"
        >
          {saving ? <span className="spinner spinner--sm" /> : 'Save'}
        </button>
      </header>

      <div className="page edit-profile-page__content">
        {/* Avatar */}
        <div className="edit-profile-page__avatar-section">
          <div className="edit-profile-page__avatar-wrap">
            {(avatarPreview || userProfile?.photoURL) ? (
              <img
                src={avatarPreview || userProfile?.photoURL}
                alt="Profile"
                className="avatar avatar--2xl"
              />
            ) : (
              <div className="avatar-placeholder avatar--2xl" style={{ fontSize: '36px' }}>
                {getInitials(displayName || userProfile?.displayName)}
              </div>
            )}
            <button
              className="edit-profile-page__avatar-btn"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Change profile photo"
            >
              <Camera size={18} strokeWidth={2} />
            </button>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <button
            className="edit-profile-page__avatar-text"
            onClick={() => avatarInputRef.current?.click()}
          >
            Change profile photo
          </button>
        </div>

        {/* Fields */}
        <div className="edit-profile-page__fields">
          <div className="input-group">
            <label className="input-label" htmlFor="edit-name">Display Name</label>
            <input
              id="edit-name"
              type="text"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-bio">Bio</label>
            <textarea
              id="edit-bio"
              className="input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={MAX_BIO_LENGTH}
              rows={3}
              placeholder="Tell the world about your wild side..."
              style={{ resize: 'vertical' }}
            />
            <span className="edit-profile-page__char-count">
              {bio.length}/{MAX_BIO_LENGTH}
            </span>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-location">Location</label>
            <input
              id="edit-location"
              type="text"
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where do you explore?"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
