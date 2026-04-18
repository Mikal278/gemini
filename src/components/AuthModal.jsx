import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { C } from '../constants/colors';
import { Btn, Field, Modal } from './shared';

export default function AuthModal({ onClose }) {
  const [email, setEmail]     = useState('');
  const [code,  setCode]      = useState('');
  const [step,  setStep]      = useState('email'); // 'email' | 'code'
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const sendOtp = async () => {
    if (!email.trim()) { setError('Enter your email address.'); return; }
    setLoading(true); setError('');
    const { error: e } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setSent(true);
    setStep('code');
  };

  const verifyCode = async () => {
    if (!code.trim()) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading(true); setError('');
    // Try 'email' type first, fall back to 'magiclink'
    let res = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    if (res.error) {
      res = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'magiclink' });
    }
    setLoading(false);
    if (res.error) { setError('Invalid or expired code. Try resending.'); return; }
    onClose?.();
  };

  const resend = () => { setStep('email'); setSent(false); setCode(''); setError(''); };

  return (
    <Modal title="Sign In to Zayd" onClose={onClose}>
      {step === 'email' ? (
        <>
          <p style={{ fontSize: 14, color: C.text2, marginBottom: 20, lineHeight: 1.5 }}>
            Enter your email and we'll send you a one-time code. No password needed.
          </p>
          <Field
            label="Email address"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />
          {error && <p style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>{error}</p>}
          <Btn label={loading ? 'Sending…' : 'Send Code'} onClick={sendOtp} disabled={loading} />
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, color: C.text2, marginBottom: 4, lineHeight: 1.5 }}>
            We sent a 6-digit code to
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>{email}</p>
          <Field
            label="One-time code"
            value={code}
            onChange={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            numeric
          />
          {error && <p style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>{error}</p>}
          <Btn label={loading ? 'Verifying…' : 'Verify Code'} onClick={verifyCode} disabled={loading} />
          <button
            onClick={resend}
            style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 14, fontSize: 13, color: C.accent2, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
          >
            Didn't get it? Resend code
          </button>
        </>
      )}
      <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        By signing in you agree to our Terms of Service and Privacy Policy.
      </p>
    </Modal>
  );
}
