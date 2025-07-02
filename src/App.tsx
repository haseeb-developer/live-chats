import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import { useEffect, useState } from 'react';
import { fetchCountryCode } from './utils/country';
import './App.css';

export default function App() {
  const [country, setCountry] = useState<string>('');

  useEffect(() => {
    fetchCountryCode().then(code => {
      if (code) setCountry(code);
    });
  }, []);

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
          <ChatWindow />
          <MessageInput country={country} />
        </SignedIn>
      </main>
    </div>
  );
}