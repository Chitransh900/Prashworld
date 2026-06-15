import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Info, Camera, Heart, Trash2 } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { subscribeToMessages, subscribeToChats, sendMessage, deleteChat, deleteMessage } from '../../services/firestore';
import { getInitials } from '../../utils/formatters';
import { Alert } from 'react-native';
import Avatar from '../../components/Avatar';
import { colors, spacing, radius, fontSize, fontWeight } from '../../utils/theme';
import SharedPostPreview from '../../components/SharedPostPreview';
import { generateAIResponse } from '../../services/ai';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const toast = useToast();

  const [messages, setMessages] = useState([]);
  const [chatInfo, setChatInfo] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAITyping, setIsAITyping] = useState(false);
  const flatListRef = useRef(null);

  const aiChatId = `ai-${user?.uid}`;
  const isAIChat = id === aiChatId;

  useEffect(() => {
    if (!user || !id) return;
    
    // Subscribe to chats to get participant details
    if (isAIChat) {
      setChatInfo({ displayName: 'Prashworld AI ✨', isAI: true, photoURL: null });
    } else {
      const unsubChat = subscribeToChats(user.uid, (chats) => {
        const chat = chats.find(c => c.id === id);
        if (chat) {
          const otherId = chat.participants.find(p => p !== user.uid);
          setChatInfo(chat.participantDetails?.[otherId] || null);
        }
      });
      return () => unsubChat();
    }
  }, [id, user, isAIChat]);

  useEffect(() => {
    if (!id) return;

    const unsubMessages = subscribeToMessages(id, (data) => {
      setMessages(data);
      setLoading(false);
    });

    return () => {
      unsubMessages();
    };
  }, [id]);

  const handleSendText = async () => {
    if (!text.trim() || !user || !id) return;
    try {
      const msg = text.trim();
      setText('');
      await sendMessage(id, user.uid, msg);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      
      if (isAIChat) {
        setIsAITyping(true);
        const response = await generateAIResponse(msg);
        await sendMessage(id, 'prashworld-ai', response);
        setIsAITyping(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      toast.error('Failed to send message');
      setIsAITyping(false);
    }
  };

  const sendHeart = async () => {
    if (!user || !id) return;
    try {
      await sendMessage(id, user.uid, '❤️');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleDeleteChat = () => {
    if (!id) return;
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChat(id);
              router.back();
              toast.success('Chat deleted');
            } catch (err) {
              toast.error('Failed to delete chat');
            }
          }
        }
      ]
    );
  };

  const handleDeleteMessage = (messageId) => {
    if (!id) return;
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMessage(id, messageId);
            } catch (err) {
              toast.error('Failed to delete message');
            }
          }
        }
      ]
    );
  };

  const groupedMessages = messages.map((msg, idx) => {
    const prevMsg = messages[idx - 1];
    const nextMsg = messages[idx + 1];
    const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
    const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
    return { ...msg, isFirstInGroup, isLastInGroup };
  });

  const renderMessage = ({ item }) => {
    const isMine = item.senderId === user?.uid;
    return (
      <View style={[styles.messageWrapper, isMine ? styles.messageMine : styles.messageTheirs]}>
        {!isMine && (
          <View style={styles.avatarContainer}>
            {item.isLastInGroup && chatInfo ? (
              <Avatar uri={chatInfo.photoURL} name={chatInfo.displayName} size="xs" />
            ) : (
              <View style={{ width: 24 }} />
            )}
          </View>
        )}
        
        {isMine ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => handleDeleteMessage(item.id)}
            style={[
              styles.messageBubble, 
              styles.bubbleMine,
              !item.isLastInGroup && { borderBottomRightRadius: 4 },
              !item.isFirstInGroup && { borderTopRightRadius: 4 },
            ]}
          >
            {item.text.startsWith('[POST_SHARE]:') ? (
              <SharedPostPreview postId={item.text.split(':')[1]} isMine={true} />
            ) : (
              <Text style={[styles.messageText, styles.textMine]}>{item.text}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[
            styles.messageBubble, 
            styles.bubbleTheirs,
            !item.isLastInGroup && { borderBottomLeftRadius: 4 },
            !item.isFirstInGroup && { borderTopLeftRadius: 4 },
          ]}>
            {item.text.startsWith('[POST_SHARE]:') ? (
              <SharedPostPreview postId={item.text.split(':')[1]} isMine={false} />
            ) : (
              <Text style={[styles.messageText, styles.textTheirs]}>{item.text}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[900]} />
        </TouchableOpacity>
        {chatInfo ? (
          <View style={styles.headerUser}>
            <Text style={[styles.headerName, isAIChat && { color: colors.primary[500] }]}>{chatInfo.displayName}</Text>
          </View>
        ) : (
          <Text style={styles.headerName}>Chat</Text>
        )}
        {!isAIChat ? (
          <TouchableOpacity style={[styles.backBtn, { alignItems: 'flex-end' }]} onPress={handleDeleteChat}>
            <Trash2 size={24} color={colors.semantic.error} strokeWidth={1.75} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary[500]} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.empty}>Send a message to start the conversation</Text>
          }
          ListFooterComponent={
            isAITyping ? (
              <View style={[styles.messageWrapper, styles.messageTheirs, { marginTop: spacing[2] }]}>
                <View style={styles.avatarContainer}>
                  <View style={[styles.typingAvatar, { backgroundColor: colors.primary[500] }]}>
                    <Text style={{ color: '#fff', fontSize: 12 }}>✨</Text>
                  </View>
                </View>
                <View style={[styles.messageBubble, styles.bubbleTheirs, { paddingVertical: spacing[3], paddingHorizontal: spacing[4] }]}>
                  <ActivityIndicator size="small" color={colors.neutral[500]} />
                </View>
              </View>
            ) : null
          }
        />
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
        <View style={styles.inputPill}>
          <TouchableOpacity style={styles.actionBtn}>
            <Camera size={24} color={colors.neutral[500]} strokeWidth={1.5} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          {text.trim() ? (
            <TouchableOpacity 
              style={styles.sendBtn} 
              onPress={handleSendText}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={sendHeart}>
              <Heart size={24} color={colors.neutral[500]} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
  },
  backBtn: { width: 32 },
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  headerName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: spacing[4], gap: 2 },
  messageWrapper: { flexDirection: 'row', marginBottom: 2, alignItems: 'flex-end' },
  messageMine: { justifyContent: 'flex-end' },
  messageTheirs: { justifyContent: 'flex-start', gap: spacing[2] },
  avatarContainer: {
    width: 24,
    height: 24,
    justifyContent: 'flex-end',
  },
  typingAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: { maxWidth: '75%', paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius['2xl'] },
  bubbleMine: { backgroundColor: colors.primary[500] },
  bubbleTheirs: { backgroundColor: colors.neutral[200] },
  messageText: { fontSize: fontSize.sm, lineHeight: 20 },
  textMine: { color: '#fff' },
  textTheirs: { color: colors.neutral[900] },
  empty: { textAlign: 'center', color: colors.neutral[400], marginTop: spacing[10] },
  inputContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[150],
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    fontSize: fontSize.sm,
    maxHeight: 100,
  },
  actionBtn: { padding: spacing[2], justifyContent: 'center', alignItems: 'center' },
  sendBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], justifyContent: 'center' },
  sendText: { color: colors.primary[500], fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
