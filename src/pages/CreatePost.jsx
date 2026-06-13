import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, MapPin, X, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createPost } from '../services/firestore';
import { uploadPostImages } from '../services/storage';
import { MAX_CAPTION_LENGTH, MAX_IMAGES_PER_POST } from '../utils/constants';
import './CreatePost.css';

const CreatePost = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [speciesTag, setSpeciesTag] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = images.length + files.length;

    if (totalImages > MAX_IMAGES_PER_POST) {
      toast.warning(`Maximum ${MAX_IMAGES_PER_POST} images per post`);
      return;
    }

    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    setImages((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.warning('Add at least one photo');
      return;
    }

    setUploading(true);
    try {
      // Upload images
      const imageURLs = await uploadPostImages(user.uid, images);

      // Create post document
      await createPost({
        authorId: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'Explorer',
        authorUsername: userProfile?.username || '',
        authorPhotoURL: userProfile?.photoURL || user.photoURL || null,
        imageURLs,
        caption: caption.trim(),
        location: location.trim(),
        speciesTag: speciesTag.trim(),
      });

      toast.success('Shared to the wild! 🌿');
      navigate('/home');
    } catch (err) {
      toast.error('Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="create-page">
      <header className="create-page__header">
        <button className="create-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="create-page__title">New Field Note</h1>
        <button
          className="btn btn--primary btn--sm btn--pill"
          onClick={handleSubmit}
          disabled={uploading || images.length === 0}
          id="share-post-btn"
        >
          {uploading ? <Loader size={16} className="animate-spin" /> : 'Share'}
        </button>
      </header>

      <div className="create-page__content page">
        {/* Image Upload */}
        {previews.length === 0 ? (
          <button
            className="create-page__upload-area"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={40} strokeWidth={1.5} className="create-page__upload-icon" />
            <span className="create-page__upload-text">Add nature photographs</span>
            <span className="create-page__upload-hint">Up to {MAX_IMAGES_PER_POST} images • JPEG, PNG, WebP</span>
          </button>
        ) : (
          <div className="create-page__previews">
            {previews.map((src, i) => (
              <div key={i} className="create-page__preview-item">
                <img src={src} alt={`Upload ${i + 1}`} className="create-page__preview-img" />
                <button
                  className="create-page__preview-remove"
                  onClick={() => removeImage(i)}
                  aria-label={`Remove image ${i + 1}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {previews.length < MAX_IMAGES_PER_POST && (
              <button
                className="create-page__add-more"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={24} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          style={{ display: 'none' }}
          id="image-upload-input"
        />

        {/* Caption */}
        <div className="create-page__field">
          <textarea
            className="input create-page__caption"
            placeholder="What did you observe in the wild today?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={MAX_CAPTION_LENGTH}
            rows={4}
            id="post-caption-input"
          />
          <span className="create-page__char-count">
            {caption.length}/{MAX_CAPTION_LENGTH}
          </span>
        </div>

        {/* Location */}
        <div className="create-page__field">
          <div className="create-page__field-icon">
            <MapPin size={18} strokeWidth={1.75} />
          </div>
          <input
            type="text"
            className="input"
            placeholder="Add location (e.g., Yellowstone, WY)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            id="post-location-input"
          />
        </div>

        {/* Species Tag */}
        <div className="create-page__field">
          <div className="create-page__field-icon">🌱</div>
          <input
            type="text"
            className="input"
            placeholder="Tag a species (e.g., Great Blue Heron)"
            value={speciesTag}
            onChange={(e) => setSpeciesTag(e.target.value)}
            id="post-species-input"
          />
        </div>
      </div>

      {/* Upload overlay */}
      {uploading && (
        <div className="create-page__overlay">
          <div className="create-page__overlay-content animate-scaleIn">
            <span className="spinner spinner--lg" />
            <p>Sharing to the wild...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
