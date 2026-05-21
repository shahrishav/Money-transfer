import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { path: '/',              label: 'Dashboard',     icon: '⊞' },
  { path: '/send-money',    label: 'Send Money',    icon: '↑' },
  { path: '/receive-money', label: 'Receive Money', icon: '↓' },
  { path: '/transactions',  label: 'Transactions',  icon: '≡' },
  { path: '/senders',       label: 'Senders',       icon: '◎' },
  { path: '/receivers',     label: 'Receivers',     icon: '◉' },
  { path: '/profile',       label: 'Profile',       icon: '○' },
];

export default function Layout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--sidebar)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--accent)',
              borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18, color: 'white',
              fontWeight: 800,
            }}>MT</div>
            <div>
              <div style={{ color: 'white', fontFamily: 'Syne', fontWeight: 800, fontSize: 16, lineHeight: 1 }}>Money Transfer</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>Japan → Nepal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 10,
                marginBottom: 4,
                textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(233,69,96,0.3)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>Logged in as</div>
          <div style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.full_name || 'User'}
          </div>
          <button onClick={logout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: 13 }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: '32px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}