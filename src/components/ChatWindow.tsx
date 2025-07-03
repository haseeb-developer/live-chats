import { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { format, isToday, isYesterday } from 'date-fns';
import { FiShield } from 'react-icons/fi';
import { countryCodeToFlagImg } from '../utils/country';

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
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  } else {
    return `${format(date, 'MM/dd/yyyy, h:mm a')}`;
  }
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
    <div className="chat-window-scroll">
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 0 18px 0',
          background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecf3 100%)',
          borderRadius: '18px 18px 0 0',
          minHeight: 300,
          width: '100%',
          boxSizing: 'border-box',
          border: '1.5px solid #e0e7ef',
          boxShadow: '0 4px 32px #0001',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', marginTop: 60 }}>No messages yet. Be the first to say hi! 👋</div>
        )}
        <ul style={{ listStyle: 'none', padding: '0 0 80px 0', margin: 0, width: '100%' }}>
          {messages.map(msg => {
            const isAdmin = msg.username === 'haseebkhan';
            const flagUrl = msg.country ? countryCodeToFlagImg(msg.country, 24) : '';
            return (
              <li
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                  width: '100%',
                  position: 'relative',
                  maxWidth: '100%',
                  transition: 'background 0.2s',
                }}
              >
                {/* Message bubble */}
                <div
                  style={{
                    background: isAdmin ? 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)' : '#fff',
                    border: isAdmin ? '2.5px solid #2563eb' : '1.5px solid #e0e7ef',
                    borderRadius: 14,
                    boxShadow: isAdmin ? '0 4px 32px #2563eb22' : '0 2px 12px #0001',
                    padding: isAdmin ? '18px 28px' : '12px 18px',
                    marginLeft: isAdmin ? 0 : 12,
                    marginRight: isAdmin ? 0 : 12,
                    minWidth: 0,
                    flex: 1,
                    position: 'relative',
                    animation: isAdmin ? 'admin-glow 1.5s infinite alternate' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    {/* Flag */}
                    {flagUrl && (
                      <img
                        src={flagUrl}
                        alt={msg.country || ''}
                        style={{ width: 22, height: 16, borderRadius: 3, objectFit: 'cover', boxShadow: '0 1px 4px #0001', marginRight: 6, border: '1px solid #e0e7ef' }}
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    {/* Username */}
                    <span style={{ fontWeight: 700, color: isAdmin ? '#fff' : '#222', fontSize: 16, letterSpacing: 0.1 }}>{msg.username}</span>
                    {/* Admin badge */}
                    {isAdmin && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', color: '#2563eb', borderRadius: 7, padding: '3px 10px', fontWeight: 700, fontSize: 14, marginLeft: 4, boxShadow: '0 1px 8px #2563eb22', border: '1.5px solid #2563eb' }}>
                        <FiShield size={15} style={{ marginRight: 2 }} /> Admin
                      </span>
                    )}
                    {/* Date/time */}
                    <span style={{ color: isAdmin ? '#e0e7ef' : '#6b7280', fontSize: 13, marginLeft: 10, fontWeight: 500 }}>{formatTime(msg.created_at)}</span>
                  </div>
                  {/* Message text */}
                  <div style={{ color: isAdmin ? '#fff' : '#222', fontSize: 16, lineHeight: 1.7, wordBreak: 'break-word', marginBottom: 0, padding: '0 2px', fontWeight: isAdmin ? 500 : 400 }}>{msg.message}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Admin message animation keyframes */}
      <style>{`
        @keyframes admin-glow {
          0% { box-shadow: 0 4px 32px #2563eb22, 0 0 0 0 #2563eb44; }
          100% { box-shadow: 0 4px 32px #2563eb22, 0 0 16px 4px #60a5fa33; }
        }
      `}</style>
    </div>
  );
} 