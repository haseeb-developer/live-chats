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
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const channel = supabase.channel('public:messages');

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
    // Broadcast stopped_typing on send
    channel.send({ type: 'broadcast', event: 'stopped_typing', payload: { username } });
  };

  // Broadcast typing event on input
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (!user) return;
    let username = user.username || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) || user.fullName || user.id;
    channel.send({ type: 'broadcast', event: 'typing', payload: { username } });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      channel.send({ type: 'broadcast', event: 'stopped_typing', payload: { username } });
    }, 1200);
  };

  // Broadcast stopped_typing on blur
  const handleBlur = () => {
    if (!user) return;
    let username = user.username || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) || user.fullName || user.id;
    channel.send({ type: 'broadcast', event: 'stopped_typing', payload: { username } });
  };

  return (
    <form
      onSubmit={handleSend}
      className="messageinput-root"
      style={{ position: 'sticky', bottom: 0 }}
    >
      <input
        ref={inputRef}
        className="messageinput-input"
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={handleTyping}
        disabled={sending}
        maxLength={300}
        autoFocus
        onBlur={handleBlur}
      />
      <button
        type="submit"
        className="messageinput-sendbtn"
        disabled={sending || !message.trim()}
        aria-label="Send"
      >
        {sending ? (
          <svg className="messageinput-spinner" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
        ) : (
          <PaperAirplaneIcon className="messageinput-icon" />
        )}
      </button>
      {error && <span className="messageinput-error">{error}</span>}
    </form>
  );
} 