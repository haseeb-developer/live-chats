import { useUser, useClerk } from '@clerk/clerk-react';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import ActiveUsers from '../components/ActiveUsers';
import { FiAlertCircle, FiSmile, FiUserCheck, FiShield, FiXCircle, FiUsers } from 'react-icons/fi';

export default function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showRules, setShowRules] = useState(false);

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
        justifyContent: 'space-between',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Rules Button for everyone */}
        <button
          title="Chat Rules"
          style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            fontWeight: 800,
            fontSize: 18,
            boxShadow: '0 4px 16px 0 #a78bfa33',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            letterSpacing: '0.01em',
            transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s',
            textTransform: 'uppercase',
          }}
          onClick={() => setShowRules(true)}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 32px 0 #a78bfa55'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px 0 #a78bfa33'; }}
        >
          Note
        </button>
        {/* Clear All Chat for Admin Only */}
        {user?.username?.toLowerCase() === 'haseebkhan' && (
          <button
            title="Clear All Chat"
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, #f472b6, #a78bfa, #3b82f6)',
              color: '#fff',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              border: 'none',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              marginRight: 8
            }}
            onClick={async () => {
              if (window.confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
                await supabase.from('messages').delete().neq('id', '');
                // Broadcast a custom event for live update
                await supabase.channel('public:messages').send({ type: 'broadcast', event: 'clear' });
              }
            }}
          >
            CLEAR ALL CHAT
          </button>
        )}
        <div className="header-user-container">
          {user && (
            <span className="header-username" style={{ marginRight: 16, color: '#fff', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.01em' }}>{user.username || user.fullName}</span>
          )}
          <button
            className="signout-btn"
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, #f472b6, #a78bfa, #3b82f6)',
              color: '#fff',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              border: 'none',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => signOut()}
          >
            Sign Out
          </button>
          <ActiveUsers />
        </div>
      </div>
      {/* Rules Modal */}
      {showRules && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.18)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 1,
            animation: 'fadeInModal 0.32s cubic-bezier(.4,2,.6,1)',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
              borderRadius: 20,
              padding: 36,
              minWidth: 620,
              maxWidth: 720,
              boxShadow: '0 8px 40px 0 #a78bfa33',
              position: 'relative',
              textAlign: 'left',
              transform: 'scale(0.96)',
              animation: 'scaleInModal 0.32s cubic-bezier(.4,2,.6,1)',
            }}
          >
            <button
              onClick={() => setShowRules(false)}
              style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 26, color: '#888', cursor: 'pointer', transition: 'color 0.18s' }}
              aria-label="Close"
              onMouseOver={e => { e.currentTarget.style.color = '#f472b6'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#888'; }}
            >
              <FiXCircle />
            </button>
            <div style={{ fontWeight: 900, fontSize: 26, marginBottom: 18, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.01em' }}>
              <FiShield size={28} style={{ color: '#60a5fa' }} /> Chat Rules
            </div>
            <ul style={{ paddingLeft: 0, color: '#222', fontSize: 17, lineHeight: 1.85, margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><FiAlertCircle style={{ color: '#f472b6' }} /> Be kind and respectful to everyone.</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><FiSmile style={{ color: '#a78bfa' }} /> No hate speech, bullying, or offensive language.</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><FiUserCheck style={{ color: '#60a5fa' }} /> No spamming or flooding the chat.</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><FiUsers style={{ color: '#2563eb' }} /> Don't share personal information.</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><FiShield style={{ color: '#7c3aed' }} /> Admins may remove or ban users for breaking rules.</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0 }}><FiSmile style={{ color: '#fbbf24' }} /> Enjoy the chat and help keep it friendly!</li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}

// Add keyframes for modal animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeInModal {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleInModal {
  from { transform: scale(0.85); }
  to { transform: scale(0.96); }
}
`;
if (!document.head.querySelector('#modal-anim')) {
  style.id = 'modal-anim';
  document.head.appendChild(style);
} 