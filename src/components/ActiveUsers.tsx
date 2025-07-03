import { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FiUsers, FiFlag } from 'react-icons/fi';

interface Presence {
  user_id: string;
  username: string;
  country: string;
  last_active: string;
}

export default function ActiveUsers() {
  const [users, setUsers] = useState<Presence[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const openModal = () => {
    setShowModal(true);
    setTimeout(() => setModalVisible(true), 10);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setShowModal(false), 250);
  };

  return (
    <div>
      <button
        className="active-users-btn"
        onClick={openModal}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: '#f3f4f6', color: '#2563eb', border: 'none', borderRadius: 20, padding: '6px 16px', fontWeight: 600, fontSize: 16, boxShadow: '0 1px 4px #0001', cursor: 'pointer', margin: 8
        }}
      >
        <FiUsers size={20} style={{ marginRight: 6 }} />
        {users.length} Active
      </button>
      {showModal && (
        <div
          className={`active-users-modal${modalVisible ? ' active-users-modal--visible' : ''}`}
          ref={modalRef}
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
            opacity: modalVisible ? 1 : 0,
            pointerEvents: modalVisible ? 'auto' : 'none',
            transition: 'opacity 0.25s cubic-bezier(.4,2,.6,1)',
          }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, minWidth: 320, boxShadow: '0 4px 32px #0002', maxHeight: '80vh', overflowY: 'auto', position: 'relative', transform: modalVisible ? 'translateY(0)' : 'translateY(40px)', transition: 'transform 0.25s cubic-bezier(.4,2,.6,1)' }}>
            <button
              onClick={closeModal}
              style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}
              aria-label="Close"
            >
              ×
            </button>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiUsers size={22} /> Active Users
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {users.map(user => {
                const isAdmin = user.username?.toLowerCase() === 'haseebkhan';
                return (
                  <li key={user.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, background: '#f3f4f6', borderRadius: 8, padding: '6px 12px', boxShadow: isAdmin ? '0 2px 12px 0 #a78bfa44' : undefined }}>
                    <FiFlag size={18} style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: 600, color: isAdmin ? '#2563eb' : '#222', fontSize: isAdmin ? '1.1em' : undefined }}>{user.username}</span>
                    {isAdmin && (
                      <span style={{
                        background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.98em',
                        borderRadius: 8,
                        padding: '2px 12px',
                        marginLeft: 6,
                        letterSpacing: '0.04em',
                        boxShadow: '0 2px 12px 0 #a78bfa44',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        textShadow: '0 2px 8px #a78bfa33',
                        textTransform: 'uppercase',
                      }} title="Admin: Full access, verified developer, owner">
                        Admin | Developer | Owner
                      </span>
                    )}
                    <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>{user.country}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 