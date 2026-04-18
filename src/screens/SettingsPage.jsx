import React, { useState } from 'react';
import { User, Star, MessageSquare, Info, Mail, LogOut, CheckCircle2, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { C } from '../constants/colors';
import { Card, Btn, SecBtn, Field, HR, SL, Pill, Row } from '../components/shared';

function SettingRow({ icon: Icon, label, value, action, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        backgroundColor: (color || C.accent) + '14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={color || C.accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>{label}</p>
        {value && <p style={{ fontSize: 12, color: C.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>}
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage({ user, onSignOut, onShowAuth, isPro }) {
  const [feedback,    setFeedback]    = useState('');
  const [fbSent,      setFbSent]      = useState(false);
  const [fbLoading,   setFbLoading]   = useState(false);
  const [changeEmail, setChangeEmail] = useState(false);
  const [newEmail,    setNewEmail]    = useState('');
  const [emailMsg,    setEmailMsg]    = useState('');

  const sendFeedback = async () => {
    if (!feedback.trim()) return;
    setFbLoading(true);
    await supabase.from('feedback').insert({ user_id: user?.id || null, message: feedback.trim() });
    setFbLoading(false);
    setFbSent(true);
    setFeedback('');
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) { setEmailMsg('Error: ' + error.message); return; }
    setEmailMsg('Check your new email for a confirmation link.');
    setChangeEmail(false);
    setNewEmail('');
  };

  const initials = user?.email ? user.email[0].toUpperCase() : null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Page title */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>Settings</h1>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Manage your account and preferences</p>
      </div>

      {/* Account */}
      <Card>
        <SL text="Account" />
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 16px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                backgroundColor: C.accent,
                color: C.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 900, flexShrink: 0, letterSpacing: '-0.02em',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{user.email}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {isPro ? <Pill label="Pro" color={C.gold} /> : <Pill label="Free plan" color={C.muted} />}
                </div>
              </div>
            </div>

            {emailMsg && (
              <div style={{ backgroundColor: C.accentL, border: `1px solid ${C.accent}22`, borderRadius: 9, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, color: C.accent2, lineHeight: 1.4 }}>{emailMsg}</p>
              </div>
            )}

            {changeEmail ? (
              <div style={{ marginBottom: 4 }}>
                <Field label="New email address" value={newEmail} onChange={setNewEmail} placeholder="new@example.com" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn label="Cancel" onClick={() => setChangeEmail(false)} variant="ghost" style={{ flex: 1 }} />
                  <Btn label="Update Email" onClick={handleChangeEmail} disabled={!newEmail.trim()} style={{ flex: 1 }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <SecBtn label="Change Email" onClick={() => setChangeEmail(true)} icon={<Mail size={13} />} />
              </div>
            )}

            <HR />
            <Btn label="Sign Out" onClick={onSignOut} variant="outline" icon={<LogOut size={15} />} />
          </>
        ) : (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: C.s3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={22} color={C.muted} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>Not signed in</p>
                <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Your data is stored locally only</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: C.text2, marginBottom: 16, lineHeight: 1.6 }}>
              Sign in to sync your home data across all your devices and never lose your repair history.
            </p>
            <Btn label="Sign In" onClick={onShowAuth} icon={<Mail size={15} />} />
          </div>
        )}
      </Card>

      {/* Upgrade to Pro */}
      {!isPro && (
        <div style={{
          background: `linear-gradient(135deg, ${C.accent} 0%, #1A5C3F 100%)`,
          borderRadius: 16,
          padding: '20px 22px',
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 8px 32px rgba(11,61,46,0.22)',
        }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Star size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 3 }}>Upgrade to Pro</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
              Unlimited AI inspections, priority support & premium features.
            </p>
          </div>
          <button
            onClick={() => {}}
            style={{
              backgroundColor: '#fff', color: C.accent,
              border: 'none', borderRadius: 9, padding: '9px 16px',
              fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Feedback */}
      <Card>
        <SL text="Feedback" />
        {fbSent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: C.greenL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <CheckCircle2 size={26} color={C.green} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4, letterSpacing: '-0.01em' }}>Thanks for the feedback!</p>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>We read every message and use it to improve Zayd.</p>
            <button onClick={() => setFbSent(false)} style={{ marginTop: 14, fontSize: 13, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Send more feedback
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 14, lineHeight: 1.6 }}>
              Have a suggestion or found a bug? We read every message.
            </p>
            <Field
              label="Your message"
              value={feedback}
              onChange={setFeedback}
              placeholder="Tell us what you think…"
              multi
            />
            <Btn
              label={fbLoading ? 'Sending…' : 'Send Feedback'}
              onClick={sendFeedback}
              disabled={fbLoading || !feedback.trim()}
              icon={<MessageSquare size={15} />}
            />
          </>
        )}
      </Card>

      {/* About */}
      <Card>
        <SL text="About" />
        <SettingRow icon={Info} label="Version" value="1.0.1" color={C.muted} />
        <div style={{ height: 1, backgroundColor: C.border }} />
        <SettingRow icon={Info} label="Platform" value="Web" color={C.muted} />
        <HR />
        <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 1.7 }}>
          Zayd helps homeowners protect their investment with<br />AI-powered insights and maintenance guidance.
        </p>
      </Card>

      <div style={{ height: 24 }} />
    </div>
  );
}
