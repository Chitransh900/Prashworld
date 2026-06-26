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
  setDoc,
  onSnapshot,
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
 * Get user by username or ID
 */
export const getUserByUsername = async (identifier) => {
  // Try by ID first
  const user = await getUserById(identifier);
  if (user) return user;

  // Try by username
  const usernameRef = doc(db, 'usernames', identifier);
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
  await setDoc(userRef, { postCount: increment(1) }, { merge: true });

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
  await setDoc(userRef, { postCount: increment(-1) }, { merge: true });
};

/* ============================================
   LIKE OPERATIONS
   ============================================ */

/**
 * Like a post
 */
export const likePost = async (postId, userId) => {
  const postRef = doc(db, 'posts', postId);
  await setDoc(postRef, {
    likes: arrayUnion(userId),
    likeCount: increment(1),
  }, { merge: true });
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId, userId) => {
  const postRef = doc(db, 'posts', postId);
  await setDoc(postRef, {
    likes: arrayRemove(userId),
    likeCount: increment(-1),
  }, { merge: true });
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
    username: targetUserData.username || '',
    displayName: targetUserData.displayName || '',
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
  batch.set(currentUserRef, { followingCount: increment(1) }, { merge: true });

  const targetUserRef = doc(db, 'users', targetUserId);
  batch.set(targetUserRef, { followerCount: increment(1) }, { merge: true });

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

  // Update counts
  const currentUserRef = doc(db, 'users', currentUserId);
  batch.set(currentUserRef, { followingCount: increment(-1) }, { merge: true });

  const targetUserRef = doc(db, 'users', targetUserId);
  batch.set(targetUserRef, { followerCount: increment(-1) }, { merge: true });

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

/* ============================================
   CHAT OPERATIONS
   ============================================ */

/**
 * Get or create a chat between two users
 */
export const getOrCreateChat = async (currentUser, targetUser) => {
  const chatsRef = collection(db, 'chats');
  const currentUserId = currentUser.id || currentUser.uid;
  const targetUserId = targetUser.id || targetUser.uid;
  
  // Check if chat exists where both users are participants
  // We can query array-contains for one user, and filter in memory for the other
  const q = query(chatsRef, where('participants', 'array-contains', currentUserId));
  const snapshot = await getDocs(q);
  
  const existingChat = snapshot.docs.find((doc) => {
    const data = doc.data();
    return data.participants.includes(targetUserId);
  });

  if (existingChat) {
    return { id: existingChat.id, ...existingChat.data() };
  }

  // Create new chat
  const newChat = {
    participants: [currentUserId, targetUserId],
    participantDetails: {
      [currentUserId]: {
        displayName: currentUser.displayName || '',
        photoURL: currentUser.photoURL || null,
        username: currentUser.username || ''
      },
      [targetUserId]: {
        displayName: targetUser.displayName || '',
        photoURL: targetUser.photoURL || null,
        username: targetUser.username || ''
      }
    },
    lastMessage: '',
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(chatsRef, newChat);
  return { id: docRef.id, ...newChat };
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (chatId, senderId, text) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const chatRef = doc(db, 'chats', chatId);

    const batch = writeBatch(db);

    const newMessageRef = doc(messagesRef);
    batch.set(newMessageRef, {
      text,
      senderId,
      createdAt: serverTimestamp(),
      read: false
    });

    batch.set(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isAI: chatId.startsWith('ai-')
    }, { merge: true });

    await batch.commit();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Delete a chat completely
export const deleteChat = async (chatId) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await deleteDoc(chatRef);
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

// Delete a specific message in a chat
export const deleteMessage = async (chatId, messageId) => {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Subscribe to user's chats
 */
export const subscribeToChats = (userId, callback) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(chats);
  });
};

/**
 * Subscribe to messages in a chat
 */
export const subscribeToMessages = (chatId, callback) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

/* ============================================
   SMART GALLERY OPERATIONS
   ============================================ */

/**
 * Add an image to the user's smart gallery
 */
export const addGalleryImage = async (userId, imageData) => {
  const galleryRef = collection(db, 'users', userId, 'gallery');
  const newImage = {
    ...imageData,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(galleryRef, newImage);
  return { id: docRef.id, ...newImage };
};

/**
 * Get all gallery images for a user (paginated)
 */
export const getGalleryImages = async (userId, pageSize = 24, lastDoc = null) => {
  const galleryRef = collection(db, 'users', userId, 'gallery');
  let q;

  if (lastDoc) {
    q = query(galleryRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
  } else {
    q = query(galleryRef, orderBy('createdAt', 'desc'), limit(pageSize));
  }

  const snapshot = await getDocs(q);
  const images = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { images, lastVisible, hasMore: snapshot.docs.length === pageSize };
};

/**
 * Delete a gallery image
 */
export const deleteGalleryImage = async (userId, imageId) => {
  await deleteDoc(doc(db, 'users', userId, 'gallery', imageId));
};

/**
 * Subscribe to gallery images in real-time
 */
export const subscribeToGallery = (userId, callback) => {
  const galleryRef = collection(db, 'users', userId, 'gallery');
  const q = query(galleryRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const images = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(images);
  });
};

/* ============================================
   SAVE OPERATIONS
   ============================================ */

export const savePost = async (postId, userId) => {
  const savedRef = doc(db, 'users', userId, 'saved', postId);
  await setDoc(savedRef, {
    postId,
    savedAt: serverTimestamp(),
  });
};

export const unsavePost = async (postId, userId) => {
  const savedRef = doc(db, 'users', userId, 'saved', postId);
  await deleteDoc(savedRef);
};

export const checkIsSaved = async (postId, userId) => {
  const savedRef = doc(db, 'users', userId, 'saved', postId);
  const snap = await getDoc(savedRef);
  return snap.exists();
};

export const getSavedPosts = async (userId, pageSize = 12, lastDoc = null) => {
  const savedRef = collection(db, 'users', userId, 'saved');
  let q;
  if (lastDoc) {
    q = query(savedRef, orderBy('savedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
  } else {
    q = query(savedRef, orderBy('savedAt', 'desc'), limit(pageSize));
  }
  
  const snapshot = await getDocs(q);
  const postIds = snapshot.docs.map(doc => doc.data().postId);
  
  const posts = await Promise.all(postIds.map(id => getPostById(id)));
  const validPosts = posts.filter(p => p !== null);
  
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
  return { posts: validPosts, lastVisible, hasMore: snapshot.docs.length === pageSize };
};

