import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Leaf, MessageSquare } from 'lucide-react-native';
import { getExplorePosts } from '../../services/firestore';
import PostCard from '../../components/PostCard';
import { colors, spacing, fontSize, fontWeight, APP_NAME } from '../../utils/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const result = await getExplorePosts(10);
      setPosts(result.posts);
      setLastDoc(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    try {
      const result = await getExplorePosts(10, lastDoc);
      setPosts((prev) => [...prev, ...result.posts]);
      setLastDoc(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Load more error:', err);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🌿</Text>
      <Text style={styles.emptyTitle}>Your trail is quiet</Text>
      <Text style={styles.emptyDesc}>
        Follow ecologists and nature photographers to see the wild world come alive.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing[2] }]}>
        <View style={styles.topBarLeft}>
          <Leaf size={22} color={colors.primary[500]} strokeWidth={2} />
          <Text style={styles.topBarTitle}>{APP_NAME}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/messages' as any)} style={styles.messageBtn}>
          <MessageSquare size={24} color={colors.neutral[900]} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} onDelete={handleDeletePost} />
          )}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && posts.length > 0 ? (
              <ActivityIndicator style={styles.footer} color={colors.primary[500]} />
            ) : posts.length > 0 ? (
              <Text style={styles.endText}>You've reached the end of the trail 🌄</Text>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  messageBtn: {
    padding: spacing[1],
  },
  topBarTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    letterSpacing: -0.5,
  },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing[20], paddingHorizontal: spacing[6] },
  emptyIcon: { fontSize: 48, marginBottom: spacing[4] },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.neutral[900], marginBottom: spacing[2] },
  emptyDesc: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  footer: { paddingVertical: spacing[6] },
  endText: { textAlign: 'center', paddingVertical: spacing[8], fontSize: fontSize.sm, color: colors.neutral[400] },
});
