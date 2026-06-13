import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const googleProvider = new GoogleAuthProvider();

/**
 * Generate a username from display name
 */
const generateUsername = (displayName) => {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20);
  const suffix = Math.floor(Math.random() * 9999);
  return `${base}_${suffix}`;
};

/**
 * Create user profile document in Firestore
 */
const createUserProfile = async (user, additionalData = {}) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const username = generateUsername(user.displayName || user.email.split('@')[0]);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      username,
      photoURL: user.photoURL || null,
      coverURL: null,
      bio: '',
      location: '',
      postCount: 0,
      followerCount: 0,
      followingCount: 0,
      authProvider: additionalData.authProvider || 'email',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...additionalData,
    };

    await setDoc(userRef, userData);

    // Reserve username
    const usernameRef = doc(db, 'usernames', username);
    await setDoc(usernameRef, { uid: user.uid });

    return userData;
  }

  return userSnap.data();
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email, password, displayName) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await createUserProfile(result.user, {
    displayName,
    authProvider: 'email',
  });
  return result.user;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await createUserProfile(result.user, { authProvider: 'google' });
  return result.user;
};

/**
 * Sign out
 */
export const signOut = async () => {
  await firebaseSignOut(auth);
};

/**
 * Reset password
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};
