import React, { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import './Messages.css';

export default function Messages() {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState('general');
  const bottomRef = useRef(null);

  const CHANNELS = ['general', 'announcements', 'help', 'introductions'];

  useEffect(() => {
    const q = query(
      collection(db, 'channels', channel, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [channel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'channels', channel, 'messages'), {
        text: text.trim(),
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'User',
        role: userProfile?.role || 'student',
        createdAt: serverTimestamp()
      });
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="messages-page fade-in">
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1rem' }}>Community</h1>

      <div className="messages-layout">
        {/* Channels */}
        <div className="channels-panel card">
          <h3>Channels</h3>
          {CHANNELS.map(ch => (
            <button
              key={ch}
              className={`channel-btn ${channel === ch ? 'active' : ''}`}
              onClick={() => setChannel(ch)}
            >
              # {ch}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="chat-panel card">
          <div className="chat-header">
            <FiMessageSquare />
            <span># {channel}</span>
          </div>

          <div className="messages-list">
            {messages.length === 0 && (
              <div className="empty-chat">
                <p>No messages yet. Be the first to say hello! 👋</p>
              </div>
            )}
            {messages.map((msg, idx) => {
              const isMe = msg.uid === currentUser?.uid;
              const showAvatar = idx === 0 || messages[idx - 1]?.uid !== msg.uid;
              return (
                <div key={msg.id} className={`message ${isMe ? 'mine' : 'theirs'}`}>
                  {!isMe && showAvatar && (
                    <div className="msg-avatar">{initials(msg.displayName)}</div>
                  )}
                  {!isMe && !showAvatar && <div className="msg-avatar-spacer" />}
                  <div className="msg-bubble-wrap">
                    {showAvatar && (
                      <div className="msg-meta">
                        <span className="msg-name">{isMe ? 'You' : msg.displayName}</span>
                        {msg.role === 'instructor' && <span className="badge badge-warning" style={{fontSize:'0.6rem'}}>Instructor</span>}
                        <span className="msg-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    )}
                    <div className="msg-bubble">{msg.text}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form className="message-input-form" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder={`Message #${channel}...`}
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={500}
            />
            <button type="submit" className="btn btn-primary" disabled={!text.trim() || sending}>
              <FiSend />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
