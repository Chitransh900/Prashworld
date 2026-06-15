import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare, Edit, Info, Camera, Heart, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { subscribeToChats, subscribeToMessages, sendMessage, deleteChat, deleteMessage } from '../services/firestore';
import { getInitials } from '../utils/formatters';
import SharedPostPreview from '../components/feed/SharedPostPreview';
import { generateAIResponse } from '../services/ai';
import './Messages.css';

const Messages = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  const aiChatId = `ai-${user?.uid}`;
  const isAIChat = chatId === aiChatId;

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToChats(user.uid, (data) => {
      setChats(data);
      setLoadingChats(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const unsubscribe = subscribeToMessages(chatId, (data) => {
      setMessages(data);
      setLoadingMessages(false);
      setTimeout(scrollToBottom, 100);
    });
    return () => unsubscribe();
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!text.trim() || !chatId || !user) return;
    try {
      const messageText = text;
      setText('');
      await sendMessage(chatId, user.uid, messageText);
      
      if (isAIChat) {
        setIsAITyping(true);
        setTimeout(scrollToBottom, 100);
        const aiResponse = await generateAIResponse(messageText);
        await sendMessage(chatId, 'prashworld-ai', aiResponse);
        setIsAITyping(false);
      }
    } catch (err) {
      toast.error('Failed to send message');
      setIsAITyping(false);
    }
  };

  const sendHeart = async () => {
    if (!chatId || !user) return;
    try {
      await sendMessage(chatId, user.uid, '❤️');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleDeleteChat = async () => {
    if (!chatId) return;
    if (window.confirm('Are you sure you want to delete this chat permanently?')) {
      try {
        await deleteChat(chatId);
        toast.success('Chat deleted');
        navigate('/messages');
      } catch (error) {
        toast.error('Failed to delete chat');
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!chatId) return;
    if (window.confirm('Delete message?')) {
      try {
        await deleteMessage(chatId, messageId);
      } catch (error) {
        toast.error('Failed to delete message');
      }
    }
  };

  const activeChat = isAIChat ? { id: aiChatId } : chats.find(c => c.id === chatId);
  
  // Find the other participant's details
  const getOtherParticipant = (chat) => {
    if (chat?.id === aiChatId) return { displayName: 'Prashworld AI ✨', photoURL: null, isAI: true };
    if (!chat || !user) return null;
    const otherId = chat.participants.find(id => id !== user.uid);
    return chat.participantDetails?.[otherId] || null;
  };

  const otherParticipant = getOtherParticipant(activeChat);

  // Group messages
  const groupedMessages = messages.map((msg, idx) => {
    const prevMsg = messages[idx - 1];
    const nextMsg = messages[idx + 1];
    const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
    const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
    return { ...msg, isFirstInGroup, isLastInGroup };
  });

  return (
    <div className={`messages-page ${chatId ? 'show-chat' : 'show-list'}`}>
      {/* Chats List Sidebar */}
      <div className="messages-sidebar">
        <div className="messages-sidebar__header">
          <h2>Messages</h2>
          <button className="icon-btn"><Edit size={20} strokeWidth={1.75} /></button>
        </div>
        <div className="messages-sidebar__list">
          <button 
            className={`chat-list-item ${isAIChat ? 'chat-list-item--active' : ''}`}
            onClick={() => navigate(`/messages/${aiChatId}`)}
          >
            <div className="avatar-placeholder avatar--md" style={{ background: 'var(--color-primary)', color: '#fff' }}>
              ✨
            </div>
            <div className="chat-list-item__info">
              <span className="chat-list-item__name" style={{ color: 'var(--color-primary)' }}>Prashworld AI</span>
              <span className="chat-list-item__last-message">Your AI Assistant</span>
            </div>
          </button>
          
          {loadingChats ? (
            <div className="messages-loader"><span className="spinner" /></div>
          ) : chats.length === 0 ? (
            <div className="messages-empty-state">
              <MessageSquare size={32} />
              <p>No messages yet</p>
            </div>
          ) : (
            chats.map((chat) => {
              const other = getOtherParticipant(chat);
              if (!other) return null;
              const isActive = chat.id === chatId;
              return (
                <button
                  key={chat.id}
                  className={`chat-list-item ${isActive ? 'chat-list-item--active' : ''}`}
                  onClick={() => navigate(`/messages/${chat.id}`)}
                >
                  {other.photoURL ? (
                    <img src={other.photoURL} alt={other.displayName} className="avatar avatar--md" />
                  ) : (
                    <div className="avatar-placeholder avatar--md">
                      {getInitials(other.displayName)}
                    </div>
                  )}
                  <div className="chat-list-item__info">
                    <span className="chat-list-item__name">{other.displayName}</span>
                    <span className="chat-list-item__last-message">
                      {chat.lastMessage || 'New chat started'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {chatId && activeChat ? (
          <>
            <div className="chat-area__header">
              <button className="chat-area__back" onClick={() => navigate('/messages')}>
                <ArrowLeft size={24} strokeWidth={1.75} />
              </button>
              <div className="chat-area__header-info">
                {otherParticipant?.photoURL ? (
                  <img src={otherParticipant.photoURL} alt={otherParticipant.displayName} className="avatar avatar--sm" />
                ) : (
                  <div className="avatar-placeholder avatar--sm">
                    {getInitials(otherParticipant?.displayName || '?')}
                  </div>
                )}
                <span className="chat-area__name" style={isAIChat ? { color: 'var(--color-primary)' } : {}}>{otherParticipant?.displayName}</span>
              </div>
              {!isAIChat && (
                <button className="icon-btn" onClick={handleDeleteChat} title="Delete Chat">
                  <Trash2 size={24} strokeWidth={1.75} color="var(--color-error)" />
                </button>
              )}
            </div>
            
            <div className="chat-area__messages">
              {loadingMessages ? (
                 <div className="messages-loader"><span className="spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="messages-empty-state">
                  <p>Send a message to start the conversation</p>
                </div>
              ) : (
                groupedMessages.map((msg) => {
                  const isMine = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`message-bubble-wrapper ${isMine ? 'message-mine' : 'message-theirs'}`}>
                      {!isMine && (
                        <div className="message-avatar-container">
                          {msg.isLastInGroup ? (
                            otherParticipant?.photoURL ? (
                              <img src={otherParticipant.photoURL} alt="Avatar" className="avatar avatar--xs" />
                            ) : (
                              <div className="avatar-placeholder avatar--xs">{getInitials(otherParticipant?.displayName || '?')}</div>
                            )
                          ) : (
                            <div className="avatar-spacer" />
                          )}
                        </div>
                      )}
                      {isMine && (
                        <button 
                          className="message-delete-btn" 
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className={`message-bubble ${msg.isFirstInGroup ? 'first' : ''} ${msg.isLastInGroup ? 'last' : ''}`}>
                        {msg.text.startsWith('[POST_SHARE]:') ? (
                          <SharedPostPreview postId={msg.text.split(':')[1]} />
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {isAITyping && (
                <div className="message-bubble-wrapper message-theirs">
                  <div className="message-avatar-container">
                    <div className="avatar-placeholder avatar--xs" style={{ background: 'var(--color-primary)', color: '#fff' }}>✨</div>
                  </div>
                  <div className="message-bubble first last" style={{ display: 'flex', gap: '4px', alignItems: 'center', minHeight: '38px' }}>
                    <span className="typing-dot" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="typing-dot" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="typing-dot" style={{ animationDelay: '300ms' }}>.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-area__input-container" onSubmit={handleSendText}>
              <div className="chat-area__input-pill">
                <button type="button" className="chat-action-btn">
                  <Camera size={24} strokeWidth={1.5} />
                </button>
                <input
                  type="text"
                  placeholder="Message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                {text.trim() ? (
                  <button type="submit" className="chat-send-text">Send</button>
                ) : (
                  <button type="button" className="chat-action-btn" onClick={sendHeart}>
                    <Heart size={24} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className="chat-area__empty">
            <MessageSquare size={48} className="chat-area__empty-icon" />
            <h3>Your Messages</h3>
            <p>Select a chat or start a new conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
