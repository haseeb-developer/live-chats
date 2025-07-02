import { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { countryCodeToFlagEmoji } from '../utils/country';
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
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const currentUsername = user?.username?.toLowerCase();
  const isAdmin = currentUsername === 'haseebkhan';
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null); // message id

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

    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

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
                style={isMsgAdmin ? { background: 'rgba(37,99,235,0.08)', borderRadius: 2, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', overflow: 'hidden', minHeight: 36, transition: 'background 0.2s', cursor: 'pointer' } : { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minHeight: 36 }}
                title={isMsgAdmin ? 'Admin: Full access, can pin/delete messages, verified developer' : undefined}
                onMouseOver={e => { if (isMsgAdmin) e.currentTarget.style.background = 'rgba(37,99,235,0.16)'; }}
                onMouseOut={e => { if (isMsgAdmin) e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; }}
              >
                <span className="chatwindow-flag">{msg.country ? countryCodeToFlagEmoji(msg.country) : '🌐'}</span>
                <span className="chatwindow-username" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '1.08em', color: isMsgAdmin ? '#2563eb' : undefined }}>
                  {msg.username}
                  {isMsgAdmin && (
                    <span title="Verified Admin" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2, verticalAlign: 'middle' }}>
                      <svg viewBox="0 0 22 22" aria-label="Verified account" role="img" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#2563eb"></path></g></svg>
                    </span>
                  )}
                  {isMsgAdmin && (
                    <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.98em', background: 'rgba(37,99,235,0.08)', borderRadius: 6, padding: '1px 8px', marginLeft: 6, letterSpacing: '0.03em', boxShadow: '0 1px 8px 0 #60a5fa33', transition: 'box-shadow 0.3s', display: 'inline-flex', alignItems: 'center' }} title="Admin: Can pin/delete messages, verified developer">Admin | Developer</span>
                  )}
                  {/* Pinned badge for demo: show on every 5th message */}
                  {isMsgAdmin && (messages.indexOf(msg) % 5 === 0) && (
                    <span style={{ color: '#fff', background: '#2563eb', borderRadius: 5, padding: '1px 7px', marginLeft: 6, fontWeight: 600, fontSize: '0.93em', letterSpacing: '0.02em' }}>Pinned</span>
                  )}
                  {/* Delete button for admin: only show if current user is admin */}
                  {isAdmin && (
                    <button style={{ marginLeft: 10, background: 'none', border: 'none', color: '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: '0.95em', padding: '2px 6px', borderRadius: 4, transition: 'background 0.2s' }} title="Delete message" onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this message?')) {
                        await supabase.from('messages').delete().eq('id', msg.id);
                        setMessages(messages => messages.filter(m => m.id !== msg.id));
                      }
                    }}>Delete</button>
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
                          <button style={{ background: 'none', border: 'none', color: '#fbbf24', fontWeight: 600, padding: '8px 16px', textAlign: 'left', cursor: 'pointer', fontSize: '1em' }} onClick={() => { setDropdownOpen(null); alert('Kick user: ' + msg.username + ' (demo)'); }}>Kick user</button>
                          <button style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, padding: '8px 16px', textAlign: 'left', cursor: 'pointer', fontSize: '1em' }} onClick={() => { setDropdownOpen(null); alert('Ban user: ' + msg.username + ' (demo)'); }}>Ban user</button>
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
                <span className="chatwindow-time">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 