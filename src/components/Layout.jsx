import React, { useState } from 'react';
import { Home, ScanSearch, TrendingUp, Wallet, Settings, Menu, X } from 'lucide-react';
import { C } from '../constants/colors';

const NAV = [
  { id: 'home',     label: 'My Home',    Icon: Home },
  { id: 'inspect',  label: 'AI Inspect', Icon: ScanSearch },
  { id: 'value',    label: 'Value',      Icon: TrendingUp },
  { id: 'costs',    label: 'Costs',      Icon: Wallet },
  { id: 'settings', label: 'Settings',   Icon: Settings },
];

export default function Layout({ activeTab, setActiveTab, user, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = user?.email ? user.email[0].toUpperCase() : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'inherit' }}>

      {/* ── Desktop Sidebar ── */}
      <aside style={{
        width: 248,
        flexShrink: 0,
        backgroundColor: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 20,
      }} className="hidden-mobile">

        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <img src="/icon.png" alt="Zayd" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'block' }} />
            <div>
              <p style={{ fontSize: 17, fontWeight: 900, color: C.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>Zayd</p>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 2, letterSpacing: '0.01em' }}>AI Home Inspector</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="zayd-nav-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '9px 12px',
                  borderRadius: 9,
                  border: 'none',
                  backgroundColor: active ? C.accentL : 'transparent',
                  color: active ? C.accent : C.text2,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  letterSpacing: '0.005em',
                }}
              >
                <Icon size={17} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {active && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.accent, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}` }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                backgroundColor: C.accent,
                color: C.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                  {user.email}
                </p>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Free plan</p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: C.muted }}>Not signed in</p>
          )}
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }} className="show-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src="/icon.png" alt="Zayd" style={{ width: 30, height: 30, borderRadius: 8, display: 'block' }} />
          <span style={{ fontSize: 16, fontWeight: 900, color: C.accent, letterSpacing: '-0.02em' }}>Zayd</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text, padding: 4, display: 'flex', alignItems: 'center' }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: 57, left: 0, right: 0, bottom: 0,
          backgroundColor: C.surface, zIndex: 25, padding: '8px 10px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }} className="show-mobile">
          {NAV.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
                className="zayd-nav-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: 13,
                  padding: '12px 14px', borderRadius: 10, border: 'none',
                  backgroundColor: active ? C.accentL : 'transparent',
                  color: active ? C.accent : C.text2,
                  fontSize: 15, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <Icon size={19} style={{ opacity: active ? 1 : 0.7 }} />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main content ── */}
      <main style={{
        marginLeft: 248,
        flex: 1,
        minWidth: 0,
      }} className="main-content">
        {children}
      </main>
    </div>
  );
}
