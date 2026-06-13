import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { getExplorePosts, searchUsers } from '../../services/firestore';
import Avatar from '../../components/Avatar';
import { formatCount } from '../../utils/formatters';
import { colors, spacing, radius, fontSize, fontWeight } from '../../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await getExplorePosts(24);
        setPosts(result.posts);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(searchTerm.trim());
        setSearchResults(results);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const renderUserResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => router.push(`/user/${item.id}`)}
      activeOpacity={0.7}
    >
      <Avatar uri={item.photoURL} name={item.displayName} size="md" />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.displayName}</Text>
        <Text style={styles.resultHandle}>@{item.username}</Text>
      </View>
      <Text style={styles.resultFollowers}>{formatCount(item.followerCount || 0)} followers</Text>
    </TouchableOpacity>
  );

  const renderGridItem = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => router.push(`/post/${item.id}`)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.imageURLs?.[0] }}
        style={styles.gridImage}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { paddingTop: insets.top + spacing[2] }]}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color={colors.neutral[400]} strokeWidth={1.75} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search explorers..."
            placeholderTextColor={colors.neutral[400]}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <X size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {searchTerm.trim() ? (
        searching ? (
          <ActivityIndicator style={styles.loader} color={colors.primary[500]} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderUserResult}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No trails match "{searchTerm}"</Text>
            }
          />
        )
      ) : loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary[500]} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  searchBar: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.neutral[900],
    paddingVertical: spacing[1],
  },
  loader: { flex: 1, alignSelf: 'center', marginTop: spacing[10] },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  resultInfo: { flex: 1, minWidth: 0 },
  resultName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  resultHandle: { fontSize: fontSize.xs, color: colors.neutral[400] },
  resultFollowers: { fontSize: fontSize.xs, color: colors.neutral[400] },
  emptyText: { textAlign: 'center', fontSize: fontSize.sm, color: colors.neutral[400], paddingTop: spacing[10] },
  gridRow: { gap: GRID_GAP },
  gridImage: { width: TILE_SIZE, height: TILE_SIZE, marginBottom: GRID_GAP },
});
