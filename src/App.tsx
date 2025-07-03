import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import ActiveUsers from './components/ActiveUsers';
import { useEffect, useState } from 'react';
import { fetchCountryCode } from './utils/country';
import { supabase } from './utils/supabaseClient';
import './App.css';

export default function App() {
  const [country, setCountry] = useState<string>('');
  const { user, isSignedIn } = useUser();

  // Fetch country code on mount
  useEffect(() => {
    fetchCountryCode().then(code => {
      if (code) setCountry(code);
    });
  }, []);

  // Presence logic
  useEffect(() => {
    if (!isSignedIn || !user) return;
    const presenceUser = {
      user_id: user.id,
      username: user.username || user.fullName || user.id,
      country: country || '',
      last_active: new Date().toISOString(),
    };
    // Insert or update presence
    supabase.from('presence').upsert(presenceUser).then();

    // Remove presence on tab close
    const handleUnload = () => {
      supabase.from('presence').delete().eq('user_id', user.id).then();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      // Remove on unmount
      supabase.from('presence').delete().eq('user_id', user.id).then();
    };
  }, [isSignedIn, user, country]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecf3 100%)', width: '100vw', overflow: 'hidden' }}>
      <Header />
      <main style={{ paddingTop: 80, width: '100%', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        <SignedOut>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: 40, background: '#fff', borderRadius: 18, boxShadow: '0 4px 32px #0001' }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>Welcome to Global Chat</span>
              <SignInButton>
                <button style={{ padding: '16px 36px', borderRadius: 999, background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)', color: '#fff', fontWeight: 700, fontSize: 20, border: 'none', boxShadow: '0 2px 8px #2563eb22', cursor: 'pointer' }}>Sign In</button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
        <SignedIn>
          {/* Fixed Sidebar */}
          <div style={{
            position: 'fixed',
            top: 80,
            left: 0,
            height: 'calc(100vh - 80px)',
            width: 260,
            minWidth: 200,
            maxWidth: 320,
            zIndex: 20,
            background: '#f7fafd',
            borderRight: '1.5px solid #e0e7ef',
            boxShadow: '2px 0 8px #0001',
            overflowY: 'auto',
          }}>
            <ActiveUsers />
          </div>
          {/* Main chat area, scrollable */}
          <div style={{
            flex: 1,
            marginLeft: 260,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 80px)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <ChatWindow />
            <MessageInput country={country} />
          </div>
        </SignedIn>
      </main>
    </div>
  );
}