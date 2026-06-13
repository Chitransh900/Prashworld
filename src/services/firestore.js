import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

/* ============================================
   USER OPERATIONS
   ============================================ */

/**
 * Get user profile by UID
 */
export const getUserById = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
};

/**
 * Get user by username
 */
export const getUserByUsername = async (username) => {
  const usernameRef = doc(db, 'usernames', username);
  const usernameSnap = await getDoc(usernameRef);
  if (!usernameSnap.exists()) return null;
  return getUserById(usernameSnap.data().uid);
};

/**
 * Update user profile
 */
export const updateUserProfile = async (uid, updates) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Search users by display name or username
 */
export const searchUsers = async (searchTerm, maxResults = 10) => {
  const term = searchTerm.toLowerCase();
  const usersRef = collection(db, 'users');

  // Search by username prefix
  const q = query(
    usersRef,
    where('username', '>=', term),
    where('username', '<=', term + '\uf8ff'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/* ============================================
   POST OPERATIONS
   ============================================ */

/**
 * Create a new post
 */
export const createPost = async (postData) => {
  const postsRef = collection(db, 'posts');
  const newPost = {
    ...postData,
    likes: [],
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isEdited: false,
  };

  const docRef = await addDoc(postsRef, newPost);

  // Increment user's post count
  const userRef = doc(db, 'users', postData.authorId);
  await updateDoc(userRef, { postCount: increment(1) });

  return { id: docRef.id, ...newPost };
};

/**
 * Get posts for explore/all feed (paginated)
 */
export const getExplorePosts = async (pageSize = 10, lastDoc = null) => {
  const postsRef = collection(db, 'posts');
  let q;

  if (lastDoc) {
    q = query(postsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
  } else {
    q = query(postsRef, orderBy('createdAt', 'desc'), limit(pageSize));
  }

  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { posts, lastVisible, hasMore: snapshot.docs.length === pageSize };
};

/**
 * Get posts by a specific user
 */
export const getUserPosts = async (userId, pageSize = 12, lastDoc = null) => {
  const postsRef = collection(db, 'posts');
  let q;

  if (lastDoc) {
    q = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  } else {
    q = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { posts, lastVisible, hasMore: snapshot.docs.length === pageSize };
};

/**
 * Get a single post by ID
 */
export const getPostById = async (postId) => {
  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  return postSnap.exists() ? { id: postSnap.id, ...postSnap.data() } : null;
};

/**
 * Delete a post
 */
export const deletePost = async (postId, authorId) => {
  await deleteDoc(doc(db, 'posts', postId));
  const userRef = doc(db, 'users', authorId);
  await updateDoc(userRef, { postCount: increment(-1) });
};

/* ============================================
   LIKE OPERATIONS
   ============================================ */

/**
 * Like a post
 */
export const likePost = async (postId, userId) => {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: arrayUnion(userId),
    likeCount: increment(1),
  });
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId, userId) => {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: arrayRemove(userId),
    likeCount: increment(-1),
  });
};

/* ============================================
   COMMENT OPERATIONS
   ============================================ */

/**
 * Add a comment to a post
 */
export const addComment = async (postId, commentData) => {
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const newComment = {
    ...commentData,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(commentsRef, newComment);

  // Increment comment count
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, { commentCount: increment(1) });

  return { id: docRef.id, ...newComment };
};

/**
 * Get comments for a post
 */
export const getComments = async (postId, pageSize = 20) => {
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'), limit(pageSize));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Delete a comment
 */
export const deleteComment = async (postId, commentId) => {
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, { commentCount: increment(-1) });
};

/* ============================================
   FOLLOW OPERATIONS
   ============================================ */

/**
 * Follow a user
 */
export const followUser = async (currentUser, targetUserId, targetUserData) => {
  const batch = writeBatch(db);

  // Add to current user's following subcollection
  const followingRef = doc(db, 'users', currentUser.uid, 'following', targetUserId);
  batch.set(followingRef, {
    uid: targetUserId,
    username: targetUserData.username,
    displayName: targetUserData.displayName,
    photoURL: targetUserData.photoURL || null,
    followedAt: serverTimestamp(),
  });

  // Add to target user's followers subcollection
  const followerRef = doc(db, 'users', targetUserId, 'followers', currentUser.uid);
  batch.set(followerRef, {
    uid: currentUser.uid,
    username: currentUser.username || '',
    displayName: currentUser.displayName || '',
    photoURL: currentUser.photoURL || null,
    followedAt: serverTimestamp(),
  });

  // Update counts
  const currentUserRef = doc(db, 'users', currentUser.uid);
  batch.update(currentUserRef, { followingCount: increment(1) });

  const targetUserRef = doc(db, 'users', targetUserId);
  batch.update(targetUserRef, { followerCount: increment(1) });

  await batch.commit();
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (currentUserId, targetUserId) => {
  const batch = writeBatch(db);

  const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  batch.delete(followingRef);

  const followerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  batch.delete(followerRef);

  const currentUserRef = doc(db, 'users', currentUserId);
  batch.update(currentUserRef, { followingCount: increment(-1) });

  const targetUserRef = doc(db, 'users', targetUserId);
  batch.update(targetUserRef, { followerCount: increment(-1) });

  await batch.commit();
};

/**
 * Check if current user follows target user
 */
export const checkIsFollowing = async (currentUserId, targetUserId) => {
  const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  const snap = await getDoc(followingRef);
  return snap.exists();
};

/**
 * Get followers list
 */
export const getFollowers = async (userId, pageSize = 20) => {
  const followersRef = collection(db, 'users', userId, 'followers');
  const q = query(followersRef, orderBy('followedAt', 'desc'), limit(pageSize));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get following list
 */
export const getFollowing = async (userId, pageSize = 20) => {
  const followingRef = collection(db, 'users', userId, 'following');
  const q = query(followingRef, orderBy('followedAt', 'desc'), limit(pageSize));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get suggested users (users the current user doesn't follow)
 */
export const getSuggestedUsers = async (currentUserId, maxResults = 5) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('followerCount', 'desc'), limit(maxResults + 1));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((user) => user.uid !== currentUserId);
};
