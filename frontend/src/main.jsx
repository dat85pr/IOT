import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Database, Clock3, UserRound, Cpu } from 'lucide-react';
import Dashboard from './view/dashboard/Dashboard.jsx';
import DataSensor from './view/sensor/DataSensor.jsx';
import ActionHistory from './view/action/ActionHistory.jsx';
import Profile from './pages/Profile.jsx';
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
