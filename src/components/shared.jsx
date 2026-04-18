import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { C } from '../constants/colors';
import { SAFETY_QUESTIONS } from '../constants/data';

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  const base = {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: '20px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
    border: `1px solid ${C.border}`,
    ...style,
  };
  return onClick
    ? <div style={base} onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()} className="zayd-card zayd-card-hover">{children}</div>
    : <div className="zayd-card" style={base}>{children}</div>;
}

// ── Btn ───────────────────────────────────────────────────────────────────────
export function Btn({ label, onClick, disabled, icon, variant = 'primary', style = {} }) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost   = variant === 'ghost';
  const isDanger  = variant === 'danger';

  let bg, tc, border;
  if (isPrimary)  { bg = disabled ? C.s3 : C.accent; tc = disabled ? C.muted : C.white; border = 'none'; }
  else if (isOutline) { bg = 'transparent'; tc = C.accent; border = `1.5px solid ${C.accent}`; }
  else if (isDanger) { bg = C.red; tc = C.white; border = 'none'; }
  else { bg = C.s2; tc = C.text; border = 'none'; }

  const cls = isPrimary ? 'zayd-btn-primary' : isOutline ? 'zayd-btn-outline' : isDanger ? 'zayd-btn-danger' : 'zayd-btn-ghost';

  return (
    <button
      onClick={onClick}
      disabled={!!disabled}
      className={cls}
      style={{
        backgroundColor: bg,
        color: tc,
        border,
        borderRadius: 10,
        padding: '11px 20px',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.01em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        width: '100%',
        ...style,
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {label}
    </button>
  );
}

// ── SecBtn ────────────────────────────────────────────────────────────────────
export function SecBtn({ label, onClick, icon, color }) {
  const clr = color || C.accent;
  return (
    <button
      onClick={onClick}
      className="zayd-sec-btn"
      style={{
        backgroundColor: clr + '14',
        border: `1px solid ${clr}28`,
        borderRadius: 8,
        padding: '7px 13px',
        fontSize: 13,
        fontWeight: 600,
        color: clr,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        letterSpacing: '0.01em',
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {label}
    </button>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
export function Field({ label, value, onChange, placeholder, numeric, multi, hint, required }) {
  const inputStyle = {
    width: '100%',
    backgroundColor: C.s2,
    border: `1.5px solid ${C.border}`,
    borderRadius: 9,
    padding: '10px 13px',
    fontSize: 14,
    color: C.text,
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5, letterSpacing: '0.02em' }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {multi
        ? <textarea className="zayd-input" style={{ ...inputStyle, minHeight: 90 }} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
        : <input className="zayd-input" style={inputStyle} type={numeric ? 'number' : 'text'} inputMode={numeric ? 'decimal' : 'text'} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
      }
      {hint && <p style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>{hint}</p>}
    </div>
  );
}

// ── Drop ──────────────────────────────────────────────────────────────────────
export function Drop({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 14, position: 'relative' }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5, letterSpacing: '0.02em' }}>{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="zayd-input"
        style={{
          width: '100%',
          backgroundColor: C.s2,
          border: `1.5px solid ${open ? C.accent : C.border}`,
          borderRadius: 9,
          padding: '10px 13px',
          fontSize: 14,
          color: C.text,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span>{value}</span>
        {open ? <ChevronUp size={15} color={C.muted} /> : <ChevronDown size={15} color={C.muted} />}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0, right: 0,
          backgroundColor: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 10,
          zIndex: 50,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          {options.map((o, i) => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false); }}
              className="zayd-drop-item"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 13px',
                fontSize: 14,
                fontWeight: value === o ? 600 : 400,
                color: value === o ? C.accent : C.text,
                backgroundColor: value === o ? C.accentL : 'transparent',
                border: 'none',
                borderBottom: i < options.length - 1 ? `1px solid ${C.border}` : 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────────
export function Pill({ label, color }) {
  return (
    <span style={{
      backgroundColor: color + '18',
      color,
      border: `1px solid ${color}28`,
      borderRadius: 99,
      padding: '2px 9px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      display: 'inline-block',
    }}>{label}</span>
  );
}

// ── HR ────────────────────────────────────────────────────────────────────────
export function HR({ style = {} }) {
  return <div style={{ height: 1, backgroundColor: C.border, margin: '14px 0', ...style }} />;
}

// ── SL (Section Label) ────────────────────────────────────────────────────────
export function SL({ text, style = {} }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 14, ...style }}>
      {text}
    </p>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
export function Row({ children, style = {} }) {
  return <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', ...style }}>{children}</div>;
}

// ── ScoreRing (SVG arc) ───────────────────────────────────────────────────────
export function ScoreRing({ score, size = 96 }) {
  const color   = getScoreColor(score);
  const label   = getScoreLabel(score);
  const sw      = Math.max(9, Math.round(size * 0.09));
  const r       = (size - sw) / 2;
  const circ    = 2 * Math.PI * r;
  const pct     = score !== null ? score / 100 : 0;
  const offset  = circ * (1 - pct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.s3} strokeWidth={sw} />
          {score !== null && (
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={color} strokeWidth={sw}
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          )}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {score !== null ? (
            <>
              <span style={{ fontSize: size * 0.255, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.03em' }}>{score}</span>
              <span style={{ fontSize: size * 0.1, fontWeight: 600, color: C.muted, letterSpacing: '0.02em' }}>/ 100</span>
            </>
          ) : (
            <span style={{ fontSize: size * 0.26, color: C.muted, fontWeight: 700 }}>—</span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ── calcSafetyScore ───────────────────────────────────────────────────────────
export function calcSafetyScore(answers) {
  if (!answers || Object.keys(answers).length === 0) return null;
  let total = 0, count = 0;
  SAFETY_QUESTIONS.forEach(q => {
    const idx = answers[q.id];
    if (idx !== undefined && idx !== null) { total += q.weights[idx]; count++; }
  });
  return count === 0 ? null : Math.round(total / count);
}

// ── getScoreColor ─────────────────────────────────────────────────────────────
export function getScoreColor(score) {
  if (score === null || score === undefined) return C.muted;
  if (score >= 80) return C.green;
  if (score >= 60) return C.accent2;
  if (score >= 40) return C.yellow;
  return C.red;
}

function getScoreLabel(score) {
  if (score === null || score === undefined) return 'Not assessed';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ children, onClose, title }) {
  return (
    <div
      className="zayd-modal-backdrop"
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.48)',
        backdropFilter: 'blur(3px)',
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="zayd-modal-panel"
        style={{
          backgroundColor: C.surface,
          borderRadius: 18,
          width: '100%',
          maxWidth: 560,
          maxHeight: '88vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 4px 24px rgba(0,0,0,0.07)',
        }}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>{title}</span>
            <button
              onClick={onClose}
              className="zayd-close-btn"
              style={{
                width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.muted, background: C.s2, border: 'none',
                borderRadius: 7, cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div style={{ overflow: 'auto', flex: 1, padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
