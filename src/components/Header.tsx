import { useUser, useClerk } from '@clerk/clerk-react';

export default function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  return (
    <header className="header-root">
      <div className="header-title-container">
        <span className="header-title">🌐 Global Chat</span>
      </div>
      {user && (
        <div className="header-user-container">
          <span className="header-username">@{user.username}</span>
          <button
            onClick={() => signOut()}
            className="signout-btn"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
} 