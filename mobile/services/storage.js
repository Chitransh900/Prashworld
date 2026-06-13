import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const IMGBB_API_KEY = 'cf83dd6ca670d089bd03ddb55f04e858';

/**
 * Compress an image before upload
 */
const compressImage = async (uri) => {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  return result.uri;
};

/**
 * Upload an image to ImgBB
 */
const uploadToImgBB = async (uri) => {
  const formData = new FormData();
  formData.append('image', {
    uri: uri,
    name: 'image.jpg',
    type: 'image/jpeg',
  });

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const result = await response.json();
  if (result.success) {
    return result.data.url; // Returns the direct image URL hosted on ImgBB
  }
  throw new Error('Image upload failed');
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (userId, imageUri) => {
  const compressedUri = await compressImage(imageUri);
  return await uploadToImgBB(compressedUri);
};

/**
 * Upload post images (array of URIs)
 */
export const uploadPostImages = async (userId, imageUris) => {
  const uploadPromises = imageUris.map(async (uri) => {
    const compressedUri = await compressImage(uri);
    return await uploadToImgBB(compressedUri);
  });
  return Promise.all(uploadPromises);
};
