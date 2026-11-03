import { useState } from "react";

export default function Login({ apiUrl, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage(""); setIsError(false); setLoading(true);
    const register = mode === "register";
    const payload = register ? { username, email, password } : { identifier, password };
    try {
      const response = await fetch(`${apiUrl}/api/auth/${register ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) { setIsError(true); setMessage(data.message || "Request failed."); return; }
      setMessage(data.message || "Success.");
      onAuthenticated(data.user);
    } catch (error) {
      setIsError(true);
      setMessage("Cannot connect to the backend. Check that the API and MongoDB are running.");
    } finally { setLoading(false); }
  }

  function switchMode(next) { setMode(next); setMessage(""); setIsError(false); }

  return (
    <main className="page">
      <section className="login-card">
        <div className="brand-mark">L</div>
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
        <p className="subtitle">{mode === "login" ? "Enter your username and password to continue." : "Register with a username, email and password."}</p>
        <div className="mode-switch" role="tablist" aria-label="Account action">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Login</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>Register</button>
        </div>
        <form onSubmit={submit}>
          {mode === "register" ? <>
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. pankaj_01" minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]+" autoComplete="username" required />
            <small className="hint">3–24 letters, numbers or underscores.</small>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </> : <>
            <label htmlFor="identifier">Username or email</label>
            <input id="identifier" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Enter username or email" autoComplete="username" required />
          </>}
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Login securely" : "Create account"}</button>
        </form>
        {message && <p className={isError ? "message error" : "message success"} role="status">{message}</p>}
        <p className="security-note">Passwords are hashed before storage. Authentication uses an HTTP-only cookie.</p>
      </section>
    </main>
  );
}
