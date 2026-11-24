import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Database, Clock3, UserRound, Cpu, LogOut } from 'lucide-react';
import Dashboard from './view/dashboard/Dashboard.jsx';
import DataSensor from './view/sensor/DataSensor.jsx';
import ActionHistory from './view/action/ActionHistory.jsx';
import Profile from './pages/Profile.jsx';
import { clearToken, getToken, saveToken } from './auth.js';
import { login } from './api/iotApi.js';
import './styles.css';
import './layout-fixes.css';

const tabs = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['sensors', 'Data Sensor', Database],
  ['history', 'Action History', Clock3],
  ['profile', 'Profile', UserRound],
];

const pageIds = new Set(tabs.map(([id]) => id));

function getPageFromHash() {
  const page = window.location.hash.replace(/^#\/?/, '');
  return pageIds.has(page) ? page : 'dashboard';
}

function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState(getPageFromHash);
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/dashboard');
    }

    const handleHashChange = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = nextPage => {
    if (nextPage !== page) window.location.hash = `/${nextPage}`;
  };

  const signIn = async event => {
    event.preventDefault();
    setLoginError('');
    try {
      const result = await login(username, password);
      saveToken(result.token);
      setAuthenticated(true);
    } catch {
      setLoginError('Tên đăng nhập hoặc mật khẩu không đúng.');
    }
  };

  if (!authenticated) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={signIn}>
          <h1>IoT Login</h1>
          <label>Username<input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required /></label>
          <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label>
          {loginError && <p role="alert" className="connection-error">{loginError}</p>}
          <button type="submit">Đăng nhập</button>
        </form>
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><Cpu size={17} /><b>IoT</b></div>
        <nav aria-label="Main navigation">
          {tabs.map(([id, label, Icon]) => (
            <button key={id} onClick={() => navigate(id)} className={page === id ? 'selected' : ''}>
              <Icon size={17} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="sidebar-logout" onClick={() => { clearToken(); setAuthenticated(false); }}>
          <LogOut size={17} /><span>Đăng xuất</span>
        </button>
      </aside>
      <main>
        <div hidden={page !== 'dashboard'}><Dashboard /></div>
        <div hidden={page !== 'sensors'}><DataSensor /></div>
        <div hidden={page !== 'history'}><ActionHistory /></div>
        <div hidden={page !== 'profile'}><Profile /></div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
