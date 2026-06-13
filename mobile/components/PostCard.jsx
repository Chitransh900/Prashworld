import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  Share,
  Animated,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal, Trash2 } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { likePost, unlikePost, deletePost } from '../services/firestore';
import { formatTimeAgo, formatCount } from '../utils/formatters';
import Avatar from './Avatar';
import { colors, spacing, radius, fontSize, fontWeight } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.uid));
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = useCallback(async () => {
    if (!user) return;

    // Heart bounce animation
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true, friction: 3 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 3 }),
    ]).start();

    if (isLiked) {
      setIsLiked(false);
      setLikeCount((c) => c - 1);
      try {
        await unlikePost(post.id, user.uid);
      } catch {
        setIsLiked(true);
        setLikeCount((c) => c + 1);
      }
    } else {
      setIsLiked(true);
      setLikeCount((c) => c + 1);
      try {
        await likePost(post.id, user.uid);
      } catch {
        setIsLiked(false);
        setLikeCount((c) => c - 1);
      }
    }
  }, [isLiked, post.id, user, scaleAnim]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${post.authorName}'s nature post on Prashworld!`,
      });
    } catch { /* cancelled */ }
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(post.id, post.authorId);
            toast.success('Post deleted');
            onDelete?.(post.id);
          } catch (err) {
            console.error(err);
            toast.error(`Error: ${err.message || 'Failed to delete post'}`);
          }
        },
      },
    ]);
  };

  const images = post.imageURLs || [];
  const isOwnPost = user?.uid === post.authorId;
  const caption = post.caption || '';
  const shouldTruncate = caption.length > 120 && !captionExpanded;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.author}
          onPress={() => router.push(`/user/${post.authorId}`)}
          activeOpacity={0.7}
        >
          <Avatar uri={post.authorPhotoURL} name={post.authorName} size="md" />
          <View>
            <Text style={styles.authorName}>{post.authorName}</Text>
            {post.location ? (
              <View style={styles.locationRow}>
                <MapPin size={10} color={colors.neutral[400]} strokeWidth={2} />
                <Text style={styles.locationText}>{post.location}</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        {isOwnPost && (
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuBtn}>
            <MoreHorizontal size={20} color={colors.neutral[400]} strokeWidth={1.75} />
          </TouchableOpacity>
        )}
      </View>

      {showMenu && isOwnPost && (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
            <Trash2 size={16} color={colors.semantic.error} />
            <Text style={styles.menuItemDanger}>Delete post</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image with Double Tap to Like */}
      {images.length > 0 && (
        <Pressable 
          onPress={(e) => {
            const time = new Date().getTime();
            const delta = time - (e._lastPress || 0);
            const DOUBLE_PRESS_DELAY = 300;
            if (delta < DOUBLE_PRESS_DELAY) {
              handleLike();
            } else {
              e._lastPress = time;
              // Add slight delay for single press to allow double press detection
              setTimeout(() => {
                if (new Date().getTime() - e._lastPress >= DOUBLE_PRESS_DELAY) {
                  router.push(`/post/${post.id}`);
                }
              }, DOUBLE_PRESS_DELAY);
            }
          }}
        >
          <Image
            source={{ uri: images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        </Pressable>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleLike} activeOpacity={0.6}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Heart
                size={24}
                color={isLiked ? colors.semantic.like : colors.neutral[900]}
                fill={isLiked ? colors.semantic.like : 'none'}
                strokeWidth={isLiked ? 0 : 1.75}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)} style={{ marginLeft: spacing[3] }}>
            <MessageCircle size={24} color={colors.neutral[900]} strokeWidth={1.75} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={{ marginLeft: spacing[3] }}>
            <Share2 size={22} color={colors.neutral[900]} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Like Count */}
      {likeCount > 0 && (
        <Text style={styles.likeCount}>
          {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {/* Caption */}
      {caption ? (
        <Text style={styles.caption}>
          <Text style={styles.captionAuthor}>{post.authorName} </Text>
          {shouldTruncate ? caption.slice(0, 120) + '... ' : caption}
          {shouldTruncate && (
            <Text style={styles.captionMore} onPress={() => setCaptionExpanded(true)}>
              more
            </Text>
          )}
        </Text>
      ) : null}

      {/* Comment Count */}
      {post.commentCount > 0 && (
        <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
          <Text style={styles.commentCount}>
            View all {post.commentCount} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Time */}
      <Text style={styles.time}>{formatTimeAgo(post.createdAt)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
    paddingBottom: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  authorName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  menuBtn: {
    padding: spacing[2],
  },
  menu: {
    position: 'absolute',
    right: spacing[4],
    top: 52,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
    minWidth: 160,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  menuItemDanger: {
    fontSize: fontSize.sm,
    color: colors.semantic.error,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[1],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  caption: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[1],
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  captionAuthor: {
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  captionMore: {
    color: colors.neutral[400],
  },
  commentCount: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[1],
    fontSize: fontSize.sm,
    color: colors.neutral[400],
  },
  time: {
    paddingHorizontal: spacing[4],
    paddingTop: 4,
    paddingBottom: spacing[2],
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

export default PostCard;
