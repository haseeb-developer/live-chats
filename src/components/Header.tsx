import { useUser, useClerk } from '@clerk/clerk-react';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FiUsers } from 'react-icons/fi';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

export default function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeUsers, setActiveUsers] = useState<{ username: string, last_active: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const removePresence = async () => {
    if (user?.username) {
      await supabase.from('presence').delete().eq('username', user.username);
    }
  };

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
    window.addEventListener('beforeunload', removePresence);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') removePresence();
      if (document.visibilityState === 'visible') upsertPresence();
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', removePresence);
      window.removeEventListener('visibilitychange', () => {});
      removePresence();
    };
  }, [user?.username]);

  // Subscribe to presence table for real-time updates
  useEffect(() => {
    const fetchActive = async () => {
      const since = new Date(Date.now() - 10000).toISOString();
      const { data } = await supabase
        .from('presence')
        .select('username,last_active')
        .gte('last_active', since);
      setActiveUsers(data || []);
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
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: 72,
      background: 'linear-gradient(90deg, #f6f8fa 0%, #e9ecf3 100%)',
      boxShadow: '0 2px 16px #0001',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 36px',
      zIndex: 100,
      borderBottom: '1.5px solid #e0e7ef',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', letterSpacing: 0.5 }}>Global Chat</span>
      </div>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ fontWeight: 600, color: '#2563eb', fontSize: 18 }}>@{user.username}</span>
          <button
            onClick={() => signOut()}
            style={{
              padding: '10px 28px',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 17,
              border: 'none',
              boxShadow: '0 2px 8px #2563eb22',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}