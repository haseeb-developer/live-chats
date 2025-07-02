import { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { countryCodeToFlagEmoji } from '../utils/country';

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
        {messages.map(msg => (
          <div key={msg.id} className="chatwindow-message-group">
            {/* Flag and Username Row */}
            <div className="chatwindow-flag-username">
              <span className="chatwindow-flag">{msg.country ? countryCodeToFlagEmoji(msg.country) : '🌐'}</span>
              <span className="chatwindow-username">
                {msg.username}
                {msg.username === 'HaseebKhan' && (
                  <span title="Verified Admin" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6, verticalAlign: 'middle' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 2 }} xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="12" fill="#2563eb"/>
                      <path d="M8 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </span>
            </div>
            {/* Admin/Verified Info */}
            {msg.username === 'HaseebKhan' && (
              <div style={{ marginLeft: 36, marginTop: -6, marginBottom: 6, fontSize: '0.95em', color: '#60a5fa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Admin | Developer</span>
                <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.92em', background: 'rgba(37,99,235,0.08)', borderRadius: 6, padding: '1px 8px', marginLeft: 4 }}>Verified</span>
              </div>
            )}
            {/* Chat Bubble */}
            <div className="chatwindow-bubble" style={msg.username === 'HaseebKhan' ? { border: '2px solid #2563eb', background: 'rgba(37,99,235,0.13)', boxShadow: '0 2px 12px 0 rgba(37,99,235,0.10)' } : {}}>
              <div className="chatwindow-message-text">
                {msg.message}
              </div>
              <span className="chatwindow-time">
                {formatTime(msg.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 