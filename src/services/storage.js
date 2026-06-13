import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import imageCompression from 'browser-image-compression';

/**
 * Compress an image file before upload
 */
const compressImage = async (file, maxSizeMB = 0.5, maxWidthOrHeight = 1920) => {
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  try {
    return await imageCompression(file, options);
  } catch {
    // Fallback to original file if compression fails
    return file;
  }
};

/**
 * Generate a unique filename
 */
const generateFilename = (prefix = 'img') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.webp`;
};

/**
 * Upload profile avatar
 */
export const uploadAvatar = async (userId, file) => {
  const compressed = await compressImage(file, 0.3, 512);
  const filename = `profile.webp`;
  const storageRef = ref(storage, `avatars/${userId}/${filename}`);
  await uploadBytes(storageRef, compressed);
  return getDownloadURL(storageRef);
};

/**
 * Upload cover photo
 */
export const uploadCover = async (userId, file) => {
  const compressed = await compressImage(file, 0.5, 1920);
  const filename = `cover.webp`;
  const storageRef = ref(storage, `covers/${userId}/${filename}`);
  await uploadBytes(storageRef, compressed);
  return getDownloadURL(storageRef);
};

/**
 * Upload post image(s)
 */
export const uploadPostImage = async (userId, file) => {
  const compressed = await compressImage(file, 0.5, 1920);
  const filename = generateFilename('post');
  const storageRef = ref(storage, `posts/${userId}/${filename}`);
  await uploadBytes(storageRef, compressed);
  return getDownloadURL(storageRef);
};

/**
 * Upload multiple post images
 */
export const uploadPostImages = async (userId, files) => {
  const uploadPromises = Array.from(files).map((file) => uploadPostImage(userId, file));
  return Promise.all(uploadPromises);
};
