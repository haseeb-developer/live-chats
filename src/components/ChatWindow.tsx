import { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { countryCodeToFlagImg } from '../utils/country';
import { format, isToday, isYesterday } from 'date-fns';
import { useUser } from '@clerk/clerk-react';

interface Message {
  id: string;
  username: string;
  country?: string;
  message: string;
  created_at: string;
}

function formatTime(ts: string) {
  const date = new Date(ts);
  if (isToday(date)) {
    return `Today - ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday - ${format(date, 'h:mm a')}`;
  } else {
    return `${format(date, 'MM/dd/yyyy - h:mm a')}`;
  }
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const currentUsername = user?.username?.toLowerCase();
  const isAdmin = currentUsername === 'haseebkhan';
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null); // message id
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) setMessages(data);
    }
    fetchMessages();

    const channel = supabase.channel('public:messages');
    const subscription = channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .on('broadcast', { event: 'clear' }, () => {
        setMessages([]);
      })
      .on('broadcast', { event: 'typing' }, payload => {
        const typingUser = payload.payload.username;
        if (!typingUser || typingUser === user?.username) return;
        setTypingUsers(prev => prev.includes(typingUser) ? prev : [...prev, typingUser]);
      })
      .on('broadcast', { event: 'stopped_typing' }, payload => {
        const typingUser = payload.payload.username;
        if (!typingUser) return;
        setTypingUsers(prev => prev.filter(u => u !== typingUser));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.username]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      ref={chatRef}
      className="chatwindow-root"
      style={{ maxHeight: '65vh', minHeight: '300px' }}
    >
      {messages.length === 0 && (
        <div className="chatwindow-empty">No messages yet. Be the first to say hi! 👋</div>
      )}
      <div className="chatwindow-messages">
        {messages.map(msg => {
          const isMsgAdmin = msg.username?.toLowerCase() === 'haseebkhan';
          return (
            <div key={msg.id} className="chatwindow-message-group" style={{ position: 'relative' }}>
              {/* Flag, Username, Badge, and Admin Info in one flex row */}
              <div
                className="chatwindow-flag-username"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  minHeight: 36,
                  marginBottom: 2,
                }}
              >
                {/* Country flag or code */}
                {msg.country ? (
                  <>
                    <img
                      src={countryCodeToFlagImg(msg.country, 24)}
                      alt={msg.country}
                      className="w-6 h-6 rounded-sm shadow border border-gray-700 bg-white object-cover"
                      style={{ minWidth: 24, display: 'inline-block' }}
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const next = target.nextElementSibling as HTMLElement;
                        if (next) next.style.display = 'inline-block';
                      }}
                    />
                    <span
                      className="country-code-fallback"
                      style={{
                        display: 'none',
                        fontSize: '0.85em',
                        fontWeight: 700,
                        border: '1.5px solid #60a5fa',
                        background: 'rgba(96,165,250,0.13)',
                        color: '#2563eb',
                        borderRadius: 6,
                        padding: '2px 8px',
                        marginRight: 2,
                        letterSpacing: '0.04em',
                        boxShadow: '0 1px 6px 0 #60a5fa22',
                        verticalAlign: 'middle',
                        minWidth: 28,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                      }}
                    >
                      {msg.country}
                    </span>
                  </>
                ) : (
                  <span className="country-code-fallback" style={{ fontSize: '0.85em', fontWeight: 700, border: '1.5px solid #60a5fa', background: 'rgba(96,165,250,0.13)', color: '#2563eb', borderRadius: 6, padding: '2px 8px', marginRight: 2, letterSpacing: '0.04em', boxShadow: '0 1px 6px 0 #60a5fa22', verticalAlign: 'middle', minWidth: 28, textAlign: 'center', textTransform: 'uppercase' }}>N/A</span>
                )}
                {/* Username, separator, and time */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '1.08em', color: isMsgAdmin ? '#2563eb' : undefined }}>
                  {msg.username}
                  <span style={{ margin: '0 2px', color: '#a1a1aa', fontWeight: 400, fontSize: '1em', opacity: 0.7 }}>· {formatTime(msg.created_at)}</span>
                  {isMsgAdmin && (
                    <span title="Verified Admin" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2, verticalAlign: 'middle' }}>
                      <svg viewBox="0 0 22 22" aria-label="Verified account" role="img" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#2563eb"></path></g></svg>
                    </span>
                  )}
                  {isMsgAdmin && (
                    <span style={{
                      background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1.05em',
                      borderRadius: 8,
                      padding: '2px 14px',
                      marginLeft: 8,
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 12px 0 #a78bfa44',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      textShadow: '0 2px 8px #a78bfa33',
                      textTransform: 'uppercase',
                    }} title="Admin: Full access, verified developer, owner">
                      Admin | Developer | Owner
                    </span>
                  )}
                  {/* 3-dot menu for admin to manage other users */}
                  {!isMsgAdmin && isAdmin && (
                    <span style={{ marginLeft: 10, position: 'relative' }}>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888', padding: '0 6px', borderRadius: 4 }}
                        title="More actions"
                        onClick={e => {
                          e.stopPropagation();
                          setDropdownOpen(dropdownOpen === msg.id ? null : msg.id);
                        }}
                      >
                        &#8942;
                      </button>
                      {dropdownOpen === msg.id && (
                        <div style={{ position: 'absolute', top: 28, right: 0, background: '#23272f', color: '#fff', borderRadius: 8, boxShadow: '0 2px 12px 0 #0003', zIndex: 10, minWidth: 120, padding: '6px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <button style={{ background: 'none', border: 'none', color: '#fbbf24', fontWeight: 600, padding: '8px 16px', textAlign: 'left', cursor: 'pointer', fontSize: '1em' }} onClick={async () => {
                            setDropdownOpen(null);
                            // Kick: remove from presence for 10 minutes
                            await supabase.from('presence').delete().eq('username', msg.username);
                            // Optionally, store a "kickedUntil" timestamp in a separate table or in-memory (not shown here)
                          }}>Kick user (10 min)</button>
                          <button style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, padding: '8px 16px', textAlign: 'left', cursor: 'pointer', fontSize: '1em' }} onClick={async () => {
                            setDropdownOpen(null);
                            // Ban: disable user in Clerk
                            try {
                              const res = await fetch(`/api/ban-user?username=${encodeURIComponent(msg.username)}`);
                              if (!res.ok) throw new Error('Failed to ban user');
                            } catch (err) {
                              alert('Failed to ban user.');
                            }
                          }}>Ban user (permanent)</button>
                        </div>
                      )}
                    </span>
                  )}
                </span>
              </div>
              {/* Chat Bubble */}
              <div className="chatwindow-bubble" style={isMsgAdmin ? { border: '2px solid #2563eb', background: 'rgba(155, 183, 243, 0.13)', boxShadow: '0 2px 12px 0 rgba(37,99,235,0.10)', borderRadius: 4, overflow: 'hidden' } : {}}>
                <div className="chatwindow-message-text">
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Typing indicator absolutely fixed above input */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 0,
        zIndex: 100,
      }}>
        {typingUsers.length > 0 && (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '64px', // adjust if your input is taller/shorter
            margin: '0 auto',
            width: '100%',
            background: 'rgba(34,38,49,0.92)',
            color: '#60a5fa',
            fontWeight: 600,
            fontSize: '1.05em',
            letterSpacing: '0.01em',
            padding: '7px 18px 3px 18px',
            minHeight: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 10,
            boxShadow: '0 2px 12px 0 #60a5fa22',
            animation: 'fadeInTyping 0.2s',
            pointerEvents: 'none',
            justifyContent: 'flex-start',
            maxWidth: '100vw',
          }}>
            {(() => {
              if (typingUsers.length === 1) {
                return `${typingUsers[0]} is typing...`;
              } else if (typingUsers.length === 2) {
                return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
              } else {
                return `${typingUsers[0]}, ${typingUsers[1]} +${typingUsers.length - 2} more are typing...`;
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// Add keyframes for typing indicator animation
const style = document.createElement('style');
style.innerHTML = `@keyframes fadeInTyping { from { opacity: 0; } to { opacity: 1; } }`;
if (!document.head.querySelector('#typing-anim')) {
  style.id = 'typing-anim';
  document.head.appendChild(style);
} 