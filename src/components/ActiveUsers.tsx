import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FiShield } from 'react-icons/fi';

interface Presence {
  user_id: string;
  username: string;
  country: string;
  last_active: string;
}

function getInitials(name: string) {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ActiveUsers() {
  const [users, setUsers] = useState<Presence[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('presence')
        .select('*');
      if (data) setUsers(data);
    }
    fetchUsers();

    const subscription = supabase
      .channel('public:presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Separate admin and other users
  const admin = users.find(u => u.username?.toLowerCase() === 'haseebkhan');
  const others = users.filter(u => u.username?.toLowerCase() !== 'haseebkhan');

  return (
    <div className="fixed-sidebar">
      {/* Admin Section */}
      {admin && (
        <div style={{
          padding: '0 24px 18px 24px',
          borderBottom: '1.5px solid #e0e7ef',
          marginBottom: 18,
        }}>
          <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 15, marginBottom: 6, letterSpacing: 0.2 }}>Admin | Developer | Owner</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px 0 #2563eb22',
              letterSpacing: '0.01em',
              userSelect: 'none',
              border: '2.5px solid #2563eb',
              position: 'relative',
            }}>
              {getInitials(admin.username)}
              {/* Green dot for online */}
              <span style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 11,
                height: 11,
                background: '#22c55e',
                border: '2px solid #fff',
                borderRadius: '50%',
                boxShadow: '0 1px 4px #22c55e44',
                display: 'inline-block',
              }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 17 }}>{admin.username}</span>
              <span style={{ color: '#888', fontSize: 13, fontWeight: 500 }}>Online</span>
            </div>
            <span style={{ marginLeft: 6, color: '#2563eb', fontWeight: 700, fontSize: 14, background: '#e6f0ff', borderRadius: 6, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}><FiShield size={14} style={{ marginRight: 2 }} /> Admin</span>
          </div>
        </div>
      )}
      {/* Active Users Section */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 15, marginBottom: 10, letterSpacing: 0.2 }}>Active Users</div>
        {others.length === 0 && <div style={{ color: '#aaa', fontSize: 14, marginTop: 8 }}>No other users online</div>}
        {others.map(user => (
          <div key={user.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#e0e7ef',
              color: '#2563eb',
              fontWeight: 800,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px 0 #2563eb11',
              letterSpacing: '0.01em',
              userSelect: 'none',
              position: 'relative',
            }}>
              {getInitials(user.username)}
              {/* Green dot for online */}
              <span style={{
                position: 'absolute',
                bottom: 3,
                right: 3,
                width: 9,
                height: 9,
                background: '#22c55e',
                border: '2px solid #fff',
                borderRadius: '50%',
                boxShadow: '0 1px 4px #22c55e44',
                display: 'inline-block',
              }} />
            </div>
            <span style={{ fontWeight: 700, color: '#222', fontSize: 15 }}>{user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 