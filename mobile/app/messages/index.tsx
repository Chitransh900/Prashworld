import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToChats } from '../../services/firestore';
import Avatar from '../../components/Avatar';
import { colors, spacing, radius, fontSize, fontWeight } from '../../utils/theme';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToChats(user.uid, (data) => {
      setChats(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const aiChatId = `ai-${user?.uid}`;

  const getOtherParticipant = (chat) => {
    if (chat?.id === aiChatId) return { displayName: 'Prashworld AI ✨', photoURL: null, isAI: true };
    if (!chat || !user) return null;
    const otherId = chat.participants.find(id => id !== user.uid);
    return chat.participantDetails?.[otherId] || null;
  };

  const renderItem = ({ item }) => {
    const other = getOtherParticipant(item);
    if (!other) return null;
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/messages/${item.id}` as any)}
      >
        <Avatar uri={other.photoURL} name={other.displayName} size="md" />
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{other.displayName}</Text>
          <Text style={styles.chatMessage} numberOfLines={1}>
            {item.lastMessage || 'New chat started'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary[500]} />
      ) : (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => router.push(`/messages/${aiChatId}` as any)}
          >
            <View style={[styles.aiAvatar, { backgroundColor: colors.primary[500] }]}>
              <Text style={{ color: '#fff', fontSize: 20 }}>✨</Text>
            </View>
            <View style={styles.chatInfo}>
              <Text style={[styles.chatName, { color: colors.primary[500] }]}>Prashworld AI</Text>
              <Text style={styles.chatMessage} numberOfLines={1}>Your AI Assistant</Text>
            </View>
          </TouchableOpacity>
          <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MessageSquare size={48} color={colors.neutral[300]} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          }
        />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
  },
  backBtn: { width: 32 },
  headerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  loader: { flex: 1, justifyContent: 'center' },
  list: { paddingVertical: spacing[2] },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: { flex: 1 },
  chatName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[900], marginBottom: 2 },
  chatMessage: { fontSize: fontSize.xs, color: colors.neutral[400] },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[20] },
  emptyIcon: { marginBottom: spacing[4] },
  emptyText: { fontSize: fontSize.sm, color: colors.neutral[400] },
});
