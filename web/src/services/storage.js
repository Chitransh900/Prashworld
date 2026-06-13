import imageCompression from 'browser-image-compression';

const IMGBB_API_KEY = 'cf83dd6ca670d089bd03ddb55f04e858';

/**
 * Compress an image file before upload
 */
const compressImage = async (file, maxSizeMB = 0.5, maxWidthOrHeight = 1920) => {
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/jpeg',
  };

  try {
    return await imageCompression(file, options);
  } catch {
    // Fallback to original file if compression fails
    return file;
  }
};

/**
 * Upload an image to ImgBB
 */
const uploadToImgBB = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (result.success) {
    return result.data.url;
  }
  throw new Error('Image upload failed');
};

/**
 * Upload profile avatar
 */
export const uploadAvatar = async (userId, file) => {
  const compressed = await compressImage(file, 0.3, 512);
  return await uploadToImgBB(compressed);
};

/**
 * Upload cover photo
 */
export const uploadCover = async (userId, file) => {
  const compressed = await compressImage(file, 0.5, 1920);
  return await uploadToImgBB(compressed);
};

/**
 * Upload post image(s)
 */
export const uploadPostImage = async (userId, file) => {
  const compressed = await compressImage(file, 0.5, 1920);
  return await uploadToImgBB(compressed);
};

/**
 * Upload multiple post images
 */
export const uploadPostImages = async (userId, files) => {
  const uploadPromises = Array.from(files).map((file) => uploadPostImage(userId, file));
  return Promise.all(uploadPromises);
};
