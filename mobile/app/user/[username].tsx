import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image, StyleSheet,
  ActivityIndicator, Share, Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Grid3X3, MapPin } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getUserByUsername, getUserPosts, checkIsFollowing, followUser, unfollowUser } from '../../services/firestore';
import Avatar from '../../components/Avatar';
import { formatCount } from '../../utils/formatters';
import { colors, spacing, radius, fontSize, fontWeight } from '../../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_SIZE = (SCREEN_WIDTH - 4) / 3;

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user, userProfile: currentUserProfile } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const p = await getUserByUsername(username);
        if (!p) { router.back(); return; }
        setProfile(p);
        const result = await getUserPosts(p.uid || p.id);
        setPosts(result.posts);
        const targetId = p.uid || p.id;
        if (user && targetId !== user.uid) {
          const following = await checkIsFollowing(user.uid, targetId);
          setIsFollowing(following);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [username, user]);

  const handleFollow = async () => {
    if (!user || !profile || followLoading) return;
    setFollowLoading(true);
    const targetId = profile.uid || profile.id;
    try {
      if (isFollowing) {
        await unfollowUser(user.uid, targetId);
        setIsFollowing(false);
        setProfile(p => ({ ...p, followerCount: (p.followerCount || 1) - 1 }));
      } else {
        await followUser(
          { uid: user.uid, displayName: currentUserProfile?.displayName, username: currentUserProfile?.username, photoURL: currentUserProfile?.photoURL },
          targetId, profile
        );
        setIsFollowing(true);
        setProfile(p => ({ ...p, followerCount: (p.followerCount || 0) + 1 }));
      }
    } catch { toast.error('Action failed'); }
    setFollowLoading(false);
  };

  const handleShare = async () => {
    try { await Share.share({ message: `Check out ${profile?.displayName} on Prashworld!` }); } catch {}
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary[500]} /></View>;
  if (!profile) return null;

  const isOwnProfile = user?.uid === (profile.uid || profile.id);

  const renderHeader = () => (
    <View>
      <View style={styles.topRow}>
        <Avatar uri={profile.photoURL} name={profile.displayName} size="xl" />
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatCount(profile.postCount || 0)}</Text>
            <Text style={styles.statLabel}>posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatCount(profile.followerCount || 0)}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatCount(profile.followingCount || 0)}</Text>
            <Text style={styles.statLabel}>following</Text>
          </View>
        </View>
      </View>
      <View style={styles.bio}>
        <Text style={styles.bioName}>{profile.displayName}</Text>
        <Text style={styles.bioUsername}>@{profile.username}</Text>
        {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
        {profile.location ? (
          <View style={styles.bioLoc}><MapPin size={14} color={colors.neutral[400]} /><Text style={styles.bioLocText}>{profile.location}</Text></View>
        ) : null}
      </View>
      <View style={styles.actions}>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/settings/edit-profile')}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={handleFollow} disabled={followLoading}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Share2 size={18} color={colors.neutral[700]} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>
      <View style={styles.tab}>
        <Grid3X3 size={18} color={colors.neutral[900]} strokeWidth={1.75} />
        <Text style={styles.tabText}>Posts</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.neutral[900]} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.displayName}</Text>
        <View style={{ width: 22 }} />
      </View>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)}>
            <Image source={{ uri: item.imageURLs?.[0] }} style={styles.gridImage} />
          </TouchableOpacity>
        )}
        numColumns={3}
        columnWrapperStyle={{ gap: 2 }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet</Text>}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingBottom: spacing[3], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.neutral[150] },
  headerTitle: { fontSize: fontSize.md, fontWeight: '600' as const, color: colors.neutral[900] },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], paddingHorizontal: spacing[4], paddingVertical: spacing[6] },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statVal: { fontSize: fontSize.md, fontWeight: '700' as const, color: colors.neutral[900] },
  statLabel: { fontSize: fontSize.xs, color: colors.neutral[400] },
  bio: { paddingHorizontal: spacing[4], gap: 2 },
  bioName: { fontSize: fontSize.md, fontWeight: '700' as const, color: colors.neutral[900] },
  bioUsername: { fontSize: fontSize.sm, color: colors.neutral[400] },
  bioText: { fontSize: fontSize.sm, color: colors.neutral[600], lineHeight: 20, marginTop: spacing[1] },
  bioLoc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing[1] },
  bioLocText: { fontSize: fontSize.xs, color: colors.neutral[400] },
  actions: { flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  editBtn: { flex: 1, backgroundColor: colors.neutral[0], borderWidth: 1.5, borderColor: colors.neutral[200], paddingVertical: spacing[3], borderRadius: radius.md, alignItems: 'center' },
  editBtnText: { fontSize: fontSize.sm, fontWeight: '600' as const, color: colors.neutral[900] },
  followBtn: { flex: 1, backgroundColor: colors.primary[500], paddingVertical: spacing[3], borderRadius: radius.md, alignItems: 'center' },
  followBtnText: { fontSize: fontSize.sm, fontWeight: '600' as const, color: '#fff' },
  followingBtn: { backgroundColor: colors.neutral[0], borderWidth: 1.5, borderColor: colors.neutral[200] },
  followingBtnText: { color: colors.neutral[900] },
  shareBtn: { width: 44, backgroundColor: colors.neutral[0], borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderTopWidth: 1, borderTopColor: colors.neutral[150], borderBottomWidth: 2, borderBottomColor: colors.neutral[900] },
  tabText: { fontSize: fontSize.sm, fontWeight: '500' as const, color: colors.neutral[900] },
  gridImage: { width: TILE_SIZE, height: TILE_SIZE, marginBottom: 2 },
  empty: { textAlign: 'center', fontSize: fontSize.sm, color: colors.neutral[400], paddingVertical: spacing[10] },
});
