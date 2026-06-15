import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { subscribeToChats, sendMessage } from '../../services/firestore';
import { getInitials, getPostURL } from '../../utils/formatters';
import { Copy, Share2 } from 'lucide-react';
import './ShareModal.css';

export default function ShareModal({ post, isOpen, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState({});

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    const unsubscribe = subscribeToChats(user.uid, (chatData) => {
      setChats(chatData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isOpen, user]);

  if (!isOpen) return null;

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
    const url = getPostURL(post.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.authorName} on Prashworld`,
          text: post.caption?.slice(0, 100) || 'Check out this post',
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-modal__header">
          <h2>Share Post</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="share-modal__content">
          {loading ? (
            <div className="share-modal__loading"><span className="spinner" /></div>
          ) : chats.length === 0 ? (
            <div className="share-modal__empty">No active chats found. Start a chat first to share!</div>
          ) : (
            <div className="share-modal__list">
              {chats.map(chat => {
                const other = getOtherParticipant(chat);
                if (!other) return null;
                const isSending = sendingTo[chat.id];
                return (
                  <div key={chat.id} className="share-chat-item">
                    {other.photoURL ? (
                      <img src={other.photoURL} alt={other.displayName} className="avatar avatar--md" />
                    ) : (
                      <div className="avatar-placeholder avatar--md">
                        {getInitials(other.displayName)}
                      </div>
                    )}
                    <span className="share-chat-item__name">{other.displayName}</span>
                    <button 
                      className="share-btn" 
                      onClick={() => handleShare(chat)}
                      disabled={isSending}
                    >
                      {isSending ? <span className="spinner spinner--small" /> : 'Send'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="share-modal__footer">
          <button className="share-external-btn" onClick={handleExternalShare}>
            {navigator.share ? <Share2 size={20} /> : <Copy size={20} />}
            <span>{navigator.share ? 'Share via...' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
