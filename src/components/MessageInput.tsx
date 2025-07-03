import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../utils/supabaseClient';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { Filter } from 'bad-words';

export default function MessageInput({ country }: { country: string }) {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const lastSentRef = useRef<number>(0);
  const filter = new Filter();
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input on '/' key (desktop only, not when already focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        window.innerWidth > 768 // Only desktop
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-hide error after 3 seconds, but re-show if error is set again
  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError(''), 3000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [error]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!message.trim() || sending) return;
    if (!user) {
      setError('User not found. Please sign in again.');
      return;
    }
    // Profanity filter
    if (filter.isProfane(message)) {
      setError('Profanity is not allowed. Please use appropriate language.');
      return;
    }
    // Prefer username, then firstName+lastName, then fullName, then id
    let username = user.username || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) || user.fullName || user.id;
    if (!username) {
      setError('Could not determine your username.');
      return;
    }
    const now = Date.now();
    if (now - lastSentRef.current < 2000) {
      setError('Please wait before sending another message.');
      return;
    }
    setSending(true);
    const { error: supabaseError } = await supabase.from('messages').insert({
      username,
      country,
      message: message.trim(),
    });
    if (supabaseError) setError(supabaseError.message);
    else setMessage('');
    lastSentRef.current = now;
    setTimeout(() => setSending(false), 2000);
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 10 }}>
      <div style={{ width: '100%', maxWidth: 'calc(100vw - 260px)', marginLeft: 260, position: 'relative' }}>
        <div className="input-fixed-bottom">
          <form
            onSubmit={handleSend}
            style={{
              width: '100%',
              background: '#f6f8fa',
              borderTop: '1.5px solid #e0e7ef',
              display: 'flex',
              alignItems: 'center',
              padding: '18px 24px 18px 24px',
              zIndex: 100,
              boxShadow: '0 -2px 16px #0001',
              position: 'relative',
            }}
          >
            <input
              ref={inputRef}
              style={{
                flex: 1,
                borderRadius: '999px',
                background: '#fff',
                color: '#222',
                padding: '14px 20px',
                outline: 'none',
                border: '1.5px solid #e0e7ef',
                fontSize: 17,
                fontWeight: 500,
                marginRight: 12,
                boxShadow: '0 1px 8px #0001',
              }}
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={sending}
              maxLength={300}
              autoFocus
            />
            <button
              type="submit"
              style={{
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
                padding: 0,
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                color: '#fff',
                fontSize: 22,
                boxShadow: '0 2px 8px #2563eb22',
                cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
                opacity: sending || !message.trim() ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
              disabled={sending || !message.trim()}
              aria-label="Send"
            >
              {sending ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </button>
            {error && <span style={{ marginLeft: 16, color: '#e11d48', fontSize: 14 }}>{error}</span>}
          </form>
        </div>
      </div>
    </div>
  );
} 