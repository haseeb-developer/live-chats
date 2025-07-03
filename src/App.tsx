import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
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
    <div className="app-root min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex flex-col w-full overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-row w-full overflow-hidden">
        <SignedOut>
          <div className="flex flex-1 items-center justify-center w-full">
            <div className="flex flex-col items-center gap-6 p-10 bg-gray-800/80 rounded-2xl shadow-2xl">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Welcome to Global Chat</span>
              <SignInButton>
                <button className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold shadow-lg hover:scale-105 transition-transform duration-200 text-xl">Sign In</button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
        <SignedIn>
          {/* Main chat area */}
          <section className="flex-1 flex flex-col h-full w-full overflow-hidden">
            <ChatWindow />
            <MessageInput country={country} />
          </section>
        </SignedIn>
      </main>
    </div>
  );
}