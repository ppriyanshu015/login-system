import { useEffect, useState } from "react";
import Login from "./components/Login.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/auth/profile`, { credentials: "include" })
      .then(async response => ({ response, data: await response.json() }))
      .then(({ response, data }) => { if (active && response.ok) setUser(data.user); })
      .catch(() => {})
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function logout() {
    try { await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }); }
    finally { setUser(null); }
  }

  if (checking) return <main className="page"><div className="loading-card">Checking your session…</div></main>;
  if (!user) return <Login apiUrl={API_URL} onAuthenticated={setUser} />;

  return (
    <main className="page">
      <section className="profile-card">
        <div className="success-icon">✓</div>
        <p className="eyebrow">AUTHENTICATED SESSION</p>
        <h1>Welcome, {user.username}!</h1>
        <p className="subtitle">You are successfully logged in.</p>
        <div className="profile-details">
          <div><span>USERNAME</span><strong>{user.username}</strong></div>
          <div><span>EMAIL</span><strong>{user.email}</strong></div>
          <div><span>USER ID</span><strong>{user.id}</strong></div>
        </div>
        <button className="primary-button" onClick={logout}>Log out</button>
      </section>
    </main>
  );
}
