import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { X, Share2 } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { subscribeToChats, sendMessage } from '../services/firestore';
import Avatar from './Avatar';
import { colors, spacing, radius, fontSize, fontWeight } from '../utils/theme';

export default function ShareSheet({ post, visible, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState({});

  useEffect(() => {
    if (!visible || !user) return;
    setLoading(true);
    const unsubscribe = subscribeToChats(user.uid, (chatData) => {
      setChats(chatData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [visible, user]);

  const handleShare = async (chat) => {
    if (!user || !post) return;
    setSendingTo(prev => ({ ...prev, [chat.id]: true }));
    try {
      await sendMessage(chat.id, user.uid, `[POST_SHARE]:${post.id}`);
      toast.success('Post shared');
    } catch (error) {
      console.error(error);
      toast.error('Failed to share post');
    } finally {
      setSendingTo(prev => ({ ...prev, [chat.id]: false }));
    }
  };

  const getOtherParticipant = (chat) => {
    if (!chat || !user) return null;
    const otherId = chat.participants?.find(id => id !== user.uid);
    return chat.participantDetails?.[otherId] || null;
  };

  const handleExternalShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `Check out ${post.authorName}'s nature post on Prashworld!`,
      });
      onClose();
    } catch {
      // ignored
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Post</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.neutral[900]} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary[500]} />
          ) : chats.length === 0 ? (
            <Text style={styles.empty}>No active chats found.</Text>
          ) : (
            <FlatList
              data={chats}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const other = getOtherParticipant(item);
                if (!other) return null;
                const isSending = sendingTo[item.id];
                return (
                  <View style={styles.chatItem}>
                    <Avatar uri={other.photoURL} name={other.displayName} size="md" />
                    <Text style={styles.chatName}>{other.displayName}</Text>
                    <TouchableOpacity 
                      style={[styles.sendBtn, isSending && styles.sendBtnDisabled]} 
                      onPress={() => handleShare(item)}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.sendText}>Send</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
              contentContainerStyle={styles.list}
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.externalBtn} onPress={handleExternalShare}>
              <Share2 size={20} color={colors.neutral[700]} />
              <Text style={styles.externalBtnText}>Share via...</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  loader: {
    padding: spacing[8],
  },
  empty: {
    padding: spacing[8],
    textAlign: 'center',
    color: colors.neutral[500],
  },
  list: {
    padding: spacing[2],
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[3],
  },
  chatName: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.neutral[900],
  },
  sendBtn: {
    backgroundColor: colors.semantic.info,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    minWidth: 70,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendText: {
    color: '#fff',
    fontWeight: fontWeight.semibold,
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    alignItems: 'center',
  },
  externalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  externalBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.neutral[800],
  },
});
