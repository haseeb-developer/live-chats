import { useUser } from '@clerk/clerk-react';
import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Header() {
  const { user } = useUser();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Presence: upsert on mount and every 5s, remove on unload
  useEffect(() => {
    if (!user?.username) return;
    const upsertPresence = async () => {
      await supabase.from('presence').upsert({
        username: user.username,
        last_active: new Date().toISOString(),
      }, { onConflict: 'username' });
    };
    upsertPresence();
    intervalRef.current = setInterval(upsertPresence, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.username]);

  // Subscribe to presence table for real-time updates
  useEffect(() => {
    const fetchActive = async () => {
      // This function is now a no-op since activeUsers is not used
    };
    fetchActive();
    const channel = supabase
      .channel('public:presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, fetchActive)
      .subscribe();
    const poll = setInterval(fetchActive, 3000); // fallback poll
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  return (
    <header
      className="header-root"
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: '1.2rem 2.5vw',
        background: 'rgba(34, 38, 49, 0.7)',
        borderRadius: '2.5rem 2.5rem 1.5rem 1.5rem',
        boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
        borderBottom: '2px solid rgba(96,165,250,0.18)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'visible',
        zIndex: 20,
      }}
    >
      <span
        className="header-title"
        style={{
          fontSize: '2.1rem',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 12px rgba(96,165,250,0.12)',
          marginRight: 10,
          userSelect: 'none',
          display: 'inline-block',
          animation: 'fadeInDown 0.7s cubic-bezier(.4,2,.6,1)'
        }}
      >
        🌐 Global Chat
      </span>
    </header>
  );
} 