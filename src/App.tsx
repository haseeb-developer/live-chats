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
    <div className="app-root">
      <Header />
      <main className="main-content">
        <SignedOut>
          <div className="signedout-container">
            <div className="signedout-card">
              <span className="welcome-title">Welcome to Global Chat</span>
              <SignInButton>
                <button className="signin-btn">Sign In</button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
        <SignedIn>
          <ActiveUsers />
          <ChatWindow />
          <MessageInput country={country} />
        </SignedIn>
      </main>
    </div>
  );
}