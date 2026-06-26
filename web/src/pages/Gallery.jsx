import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  Upload,
  Sparkles,
  Trash2,
  ImageIcon,
  Palette,
  Tag,
  Clock,
  Loader,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { analyzeImageForTags, extractSearchKeywords } from '../services/ai';
import { uploadGalleryImage } from '../services/storage';
import { addGalleryImage, subscribeToGallery, deleteGalleryImage } from '../services/firestore';
import './Gallery.css';

const CATEGORIES = ['all', 'nature', 'animal', 'landscape', 'portrait', 'food', 'architecture', 'travel', 'art', 'other'];

const Gallery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Subscribe to gallery images in real-time
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToGallery(user.uid, (galleryImages) => {
      setImages(galleryImages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter images by category
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredImages(images);
    } else {
      setFilteredImages(images.filter((img) => img.category === activeCategory));
    }
  }, [images, activeCategory]);

  // AI-powered search with debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      if (activeCategory === 'all') {
        setFilteredImages(images);
      } else {
        setFilteredImages(images.filter((img) => img.category === activeCategory));
      }
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const keywords = await extractSearchKeywords(searchTerm);

        const matched = images.filter((img) => {
          const allText = [
            ...(img.tags || []),
            img.description || '',
            img.mood || '',
            img.category || '',
            ...(img.dominantColors || []),
          ]
            .join(' ')
            .toLowerCase();

          return keywords.some((kw) => allText.includes(kw.toLowerCase()));
        });

        setFilteredImages(matched);
      } catch {
        // Fallback: basic text search
        const term = searchTerm.toLowerCase();
        setFilteredImages(
          images.filter((img) =>
            (img.tags || []).some((t) => t.includes(term)) ||
            (img.description || '').toLowerCase().includes(term)
          )
        );
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchTerm, images, activeCategory]);

  // Handle file upload
  const handleUpload = useCallback(
    async (files) => {
      if (!user || !files || files.length === 0) return;

      setUploading(true);
      const totalFiles = files.length;

      try {
        for (let i = 0; i < totalFiles; i++) {
          const file = files[i];
          if (!file.type.startsWith('image/')) continue;

          const currentFile = i + 1;

          // Step 1: AI Analysis
          setUploadStep(`Analyzing image ${currentFile}/${totalFiles} with AI...`);
          setUploadProgress(((i * 3) / (totalFiles * 3)) * 100);
          const analysis = await analyzeImageForTags(file);

          // Step 2: Upload to storage
          setUploadStep(`Uploading image ${currentFile}/${totalFiles}...`);
          setUploadProgress(((i * 3 + 1) / (totalFiles * 3)) * 100);
          const imageURL = await uploadGalleryImage(user.uid, file);

          // Step 3: Save to Firestore
          setUploadStep(`Saving metadata ${currentFile}/${totalFiles}...`);
          setUploadProgress(((i * 3 + 2) / (totalFiles * 3)) * 100);
          await addGalleryImage(user.uid, {
            imageURL,
            tags: analysis.tags,
            description: analysis.description,
            dominantColors: analysis.dominantColors,
            mood: analysis.mood,
            category: analysis.category,
            fileName: file.name,
          });
        }

        setUploadProgress(100);
        toast.success(`${totalFiles} image${totalFiles > 1 ? 's' : ''} added to your gallery! ✨`);
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Upload failed: ${err.message || 'Unknown error'}`);
      } finally {
        setUploading(false);
        setUploadStep('');
        setUploadProgress(0);
      }
    },
    [user, toast]
  );

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleUpload(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleUpload(files);
    e.target.value = '';
  };

  // Delete handler
  const handleDelete = async (imageId) => {
    if (!user) return;
    try {
      await deleteGalleryImage(user.uid, imageId);
      setSelectedImage(null);
      toast.success('Image removed from gallery');
    } catch (err) {
      toast.error('Failed to delete image');
    }
  };

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get unique categories from uploaded images
  const activeCategoryCounts = CATEGORIES.reduce((acc, cat) => {
    if (cat === 'all') {
      acc[cat] = images.length;
    } else {
      acc[cat] = images.filter((img) => img.category === cat).length;
    }
    return acc;
  }, {});

  return (
    <div className="gallery-page">
      {/* Header */}
      <header className="gallery-page__header">
        <div className="gallery-page__header-left">
          <button className="gallery-page__back" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={22} strokeWidth={1.75} />
          </button>
          <div>
            <h1 className="gallery-page__title">Smart Gallery</h1>
            <span className="gallery-page__title-sub">AI-Powered Visual Search</span>
          </div>
        </div>
        <button
          className="btn btn--primary btn--sm btn--pill"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          id="gallery-upload-btn"
        >
          <Upload size={16} strokeWidth={2} />
          Upload
        </button>
      </header>

      {/* Search */}
      <div className="gallery-page__search">
        <div className="gallery-page__search-wrap">
          <Search size={18} strokeWidth={1.75} className="gallery-page__search-icon" />
          <input
            type="text"
            className="gallery-page__search-input"
            placeholder='Search with AI — try "sunset over mountains" or "red flowers"...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="gallery-search-input"
          />
          {searchTerm && !searching && (
            <button
              className="gallery-page__search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          {searching && (
            <div className="gallery-page__search-loading">
              <Loader size={18} className="animate-spin" style={{ color: 'var(--color-primary-500)' }} />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {images.length > 0 && (
        <div className="gallery-page__stats">
          <div className="gallery-page__stat">
            <ImageIcon size={14} strokeWidth={2} />
            <span className="gallery-page__stat-value">{images.length}</span> photos
          </div>
          <div className="gallery-page__stat">
            <Tag size={14} strokeWidth={2} />
            <span className="gallery-page__stat-value">
              {new Set(images.flatMap((img) => img.tags || [])).size}
            </span>{' '}
            unique tags
          </div>
          <div className="gallery-page__stat">
            <Sparkles size={14} strokeWidth={2} />
            AI analyzed
          </div>
        </div>
      )}

      {/* Category Filters */}
      {images.length > 0 && (
        <div className="gallery-page__filters">
          {CATEGORIES.filter((cat) => activeCategoryCounts[cat] > 0).map((cat) => (
            <button
              key={cat}
              className={`gallery-page__filter-chip${activeCategory === cat ? ' gallery-page__filter-chip--active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                setSearchTerm('');
              }}
            >
              {cat === 'all' ? '🌍 All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              <span style={{ opacity: 0.7 }}> ({activeCategoryCounts[cat]})</span>
            </button>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="gallery-upload-progress animate-fadeIn">
          <div className="gallery-upload-progress__header">
            <Loader size={24} className="animate-spin gallery-upload-progress__spinner" style={{ color: 'var(--color-primary-500)' }} />
            <div className="gallery-upload-progress__info">
              <div className="gallery-upload-progress__title">Processing with AI</div>
              <div className="gallery-upload-progress__step">{uploadStep}</div>
            </div>
          </div>
          <div className="gallery-upload-progress__bar-track">
            <div
              className="gallery-upload-progress__bar-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="gallery-file-input"
      />

      {/* Content */}
      {loading ? (
        <div className="gallery-grid">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="skeleton gallery-grid__skeleton"
              style={{ height: `${180 + Math.random() * 120}px` }}
            />
          ))}
        </div>
      ) : images.length === 0 && !uploading ? (
        /* Empty State with Upload Zone */
        <div
          className={`gallery-upload${dragging ? ' gallery-upload--dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
        >
          <div className="gallery-upload__icon">
            <Sparkles size={28} strokeWidth={1.75} />
          </div>
          <span className="gallery-upload__text">
            {dragging ? 'Drop images here!' : 'Upload your first image'}
          </span>
          <span className="gallery-upload__hint">
            Drag & drop or click to browse • AI will auto-tag your images
          </span>
        </div>
      ) : (
        <>
          {/* Masonry Grid */}
          {filteredImages.length === 0 && searchTerm ? (
            <div className="gallery-empty">
              <div className="gallery-empty__icon">
                <Search size={32} strokeWidth={1.5} />
              </div>
              <h2 className="gallery-empty__title">No matches found</h2>
              <p className="gallery-empty__text">
                Try a different search term. AI searches across tags, descriptions, colors, and mood.
              </p>
            </div>
          ) : (
            <div
              className="gallery-grid"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="gallery-item animate-fadeIn"
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img.imageURL}
                    alt={img.description || 'Gallery image'}
                    className="gallery-item__image"
                    loading="lazy"
                  />
                  <div className="gallery-item__overlay">
                    <p className="gallery-item__description">{img.description}</p>
                    <div className="gallery-item__tags">
                      {(img.tags || []).slice(0, 4).map((tag, i) => (
                        <span key={i} className="gallery-item__tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="gallery-item__category">{img.category}</span>
                  <div className="gallery-item__actions">
                    <button
                      className="gallery-item__action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img.id);
                      }}
                      aria-label="Delete image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Action Button */}
      {images.length > 0 && !uploading && (
        <button
          className="gallery-fab"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload images"
        >
          <Plus size={24} strokeWidth={2} />
        </button>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="gallery-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedImage(null);
          }}
        >
          <div className="gallery-modal animate-scaleIn">
            <div className="gallery-modal__image-wrap">
              <img
                src={selectedImage.imageURL}
                alt={selectedImage.description}
                className="gallery-modal__image"
              />
              <button
                className="gallery-modal__close"
                onClick={() => setSelectedImage(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="gallery-modal__details">
              <p className="gallery-modal__description">{selectedImage.description}</p>
              <div className="gallery-modal__meta">
                <div className="gallery-modal__meta-item">
                  <Tag size={14} strokeWidth={2} />
                  <span style={{ textTransform: 'capitalize' }}>{selectedImage.category}</span>
                </div>
                <div className="gallery-modal__meta-item">
                  <Palette size={14} strokeWidth={2} />
                  <span style={{ textTransform: 'capitalize' }}>{selectedImage.mood}</span>
                </div>
                {selectedImage.createdAt && (
                  <div className="gallery-modal__meta-item">
                    <Clock size={14} strokeWidth={2} />
                    <span>{formatDate(selectedImage.createdAt)}</span>
                  </div>
                )}
              </div>
              <div className="gallery-modal__tags">
                {(selectedImage.tags || []).map((tag, i) => (
                  <span
                    key={i}
                    className="gallery-modal__tag"
                    onClick={() => {
                      setSearchTerm(tag);
                      setSelectedImage(null);
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              {selectedImage.dominantColors?.length > 0 && (
                <div className="gallery-modal__colors">
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    Colors:
                  </span>
                  {selectedImage.dominantColors.map((color, i) => (
                    <span
                      key={i}
                      className="gallery-modal__color-dot"
                      style={{ background: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="gallery-modal__footer">
              <button
                className="btn btn--danger btn--sm"
                onClick={() => handleDelete(selectedImage.id)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
