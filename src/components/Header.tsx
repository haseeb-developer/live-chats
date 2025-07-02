import { useUser, useClerk } from '@clerk/clerk-react';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

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
    <header
      className="header-root"
      style={{
        width: '100vw',
        maxWidth: 900,
        margin: '0 auto',
        padding: '1.2rem 2.5vw',
        background: 'rgba(34, 38, 49, 0.7)',
        borderRadius: '2.5rem 2.5rem 1.5rem 1.5rem',
        boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
        borderBottom: '2px solid rgba(96,165,250,0.18)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'visible',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(96,165,250,0.13)',
            borderRadius: 14,
            padding: '4px 18px',
            fontWeight: 700,
            color: '#60a5fa',
            fontSize: '1.13em',
            boxShadow: '0 2px 12px 0 rgba(96,165,250,0.10)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            animation: 'scaleIn 0.6s cubic-bezier(.4,2,.6,1)'
          }}
          onClick={() => setShowDropdown((v) => !v)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ marginRight: 2 }} xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="11" fill="#60a5fa" opacity="0.18"/><text x="11" y="16" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#60a5fa">👥</text></svg>
            <span style={{ fontWeight: 800, fontSize: '1.18em', color: '#fff', transition: 'color 0.2s', animation: 'popIn 0.7s cubic-bezier(.4,2,.6,1)' }}>{activeUsers.length}</span>
          </span>
          <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.98em', marginLeft: 8, opacity: 0.8 }}>Active</span>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ marginLeft: 6, transition: 'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'none' }}><path d="M6 8l4 4 4-4" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 38,
                left: 0,
                minWidth: 220,
                background: 'rgba(34,38,49,0.98)',
                borderRadius: 18,
                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
                padding: '12px 0',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                animation: 'fadeInUp 0.4s cubic-bezier(.4,2,.6,1)'
              }}
            >
              {activeUsers.length === 0 && (
                <span style={{ color: '#fff', opacity: 0.7, padding: '10px 24px', fontWeight: 500 }}>No active users</span>
              )}
              {activeUsers.map((u, i) => (
                <div
                  key={u.username}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 24px',
                    borderBottom: i !== activeUsers.length - 1 ? '1px solid rgba(96,165,250,0.08)' : 'none',
                    animation: 'fadeInUp 0.5s cubic-bezier(.4,2,.6,1)',
                    animationDelay: `${i * 0.05}s`,
                    animationFillMode: 'both',
                  }}
                >
                  <span style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.1em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px 0 #60a5fa22',
                    letterSpacing: '0.01em',
                    userSelect: 'none',
                    border: u.username.toLowerCase() === 'haseebkhan' ? '2.5px solid #2563eb' : 'none',
                    transition: 'border 0.2s',
                  }}>{getInitials(u.username)}</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.08em', letterSpacing: '-0.01em', textShadow: '0 1px 4px #23272f55' }}>{u.username}</span>
                  {u.username.toLowerCase() === 'haseebkhan' && (
                    <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.98em', background: 'rgba(37,99,235,0.08)', borderRadius: 6, padding: '1px 8px', marginLeft: 6, letterSpacing: '0.03em', boxShadow: '0 1px 8px 0 #60a5fa33', transition: 'box-shadow 0.3s', display: 'inline-flex', alignItems: 'center' }}>Admin</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {user && (
        <div className="header-user-container" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="header-username" style={{ fontWeight: 700, fontSize: '1.13em', color: '#fff', background: 'rgba(96,165,250,0.13)', borderRadius: 10, padding: '4px 16px', boxShadow: '0 2px 8px 0 #60a5fa22', letterSpacing: '0.01em', userSelect: 'none', animation: 'fadeInRight 0.7s cubic-bezier(.4,2,.6,1)' }}>@{user.username}</span>
          <button
            onClick={() => signOut()}
            className="signout-btn"
            style={{ fontWeight: 700, fontSize: '1.08em', borderRadius: 10, padding: '6px 18px', background: 'linear-gradient(90deg, #f472b6, #a78bfa, #3b82f6)', color: '#fff', boxShadow: '0 2px 8px 0 #f472b633', border: 'none', transition: 'background 0.2s', cursor: 'pointer', animation: 'fadeInRight 0.7s cubic-bezier(.4,2,.6,1)' }}
          >
            Sign Out
          </button>
        </div>
      )}
      <style>{`
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInRight {
          0% { opacity: 0; transform: translateX(30px) scale(0.95); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(1.4); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </header>
  );
} 