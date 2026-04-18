import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ClipboardList, Wrench, Receipt, TrendingUp,
  AlertTriangle, CheckCircle2, Trash2, Plus, RotateCcw,
  Pencil, Home, X,
} from 'lucide-react';
import { C, fmt } from '../constants/colors';
import { SAFETY_QUESTIONS, CATEGORIES, HOME_TYPES, CATS, DEFAULT_PROFILE } from '../constants/data';
import { Card, Btn, SecBtn, Field, Drop, Pill, HR, SL, Row, ScoreRing, Modal, calcSafetyScore, getScoreColor } from '../components/shared';

const TABS = [
  { id: 'score',  label: 'HomeDNA Score' },
  { id: 'log',    label: 'Repair Log' },
  { id: 'budget', label: 'Budget' },
];

const EMPTY_REPAIR = { type: 'Expense', name: '', category: 'Interior', contractor: '', cost: '', warranty: '', date: '', notes: '' };

export default function MyHomePage({ user, profile, properties, addProperty, updateProperty, activePropertyIdx, setActivePropertyIdx, safetyAnswers, saveSafetyAnswers, score, repairLog, addRepair, removeRepair, grantAward, onShowAuth }) {
  const [tab,            setTab]            = useState('score');
  const [editProfile,    setEditProfile]    = useState(false);
  const [draft,          setDraft]          = useState(profile);
  const [assessing,      setAssessing]      = useState(false);
  const [curQ,           setCurQ]           = useState(0);
  const [localAnswers,   setLocalAnswers]   = useState({});
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [repairForm,     setRepairForm]     = useState(EMPTY_REPAIR);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);

  useEffect(() => { setDraft(profile); }, [profile]);

  const propertyAnswers = profile.id ? safetyAnswers[profile.id] || {} : {};
  const answered        = Object.keys(propertyAnswers).length;
  const total           = SAFETY_QUESTIONS.length;
  const totalExpenses   = repairLog.filter(r => r.type !== 'Income').reduce((a, r) => a + (r.cost || 0), 0);
  const totalIncome     = repairLog.filter(r => r.type === 'Income').reduce((a, r) => a + (r.cost || 0), 0);
  const netPL           = totalIncome - totalExpenses;
  const actionItems     = SAFETY_QUESTIONS.filter(q => { const idx = propertyAnswers[q.id]; return idx !== undefined && q.weights[idx] < 60; });

  const handleSaveProfile = () => {
    if (!draft.name.trim()) return;
    if (profile.id) updateProperty(activePropertyIdx, draft);
    else addProperty(draft);
    setEditProfile(false);
    grantAward?.('profile_setup');
  };

  const startAssessment = () => {
    if (!user) { onShowAuth?.(); return; }
    setLocalAnswers({ ...propertyAnswers });
    setCurQ(0);
    setAssessing(true);
  };

  const answerQuestion = (qIdx, aIdx) => {
    const q = SAFETY_QUESTIONS[qIdx];
    const updated = { ...localAnswers, [q.id]: aIdx };
    setLocalAnswers(updated);
    if (qIdx < SAFETY_QUESTIONS.length - 1) {
      setCurQ(qIdx + 1);
    } else {
      saveSafetyAnswers(updated);
      setAssessing(false);
      const s = calcSafetyScore(updated);
      if (s !== null) {
        grantAward?.('first_scan');
        if (Object.keys(updated).length >= 15) grantAward?.('full_scan');
        if (s >= 80) grantAward?.('score_80');
        else if (s >= 60) grantAward?.('score_60');
      }
    }
  };

  const handleAddRepair = () => {
    if (!repairForm.name.trim()) return;
    addRepair({ ...repairForm, cost: parseFloat(repairForm.cost) || 0, date: repairForm.date || new Date().toLocaleDateString('en-US') });
    setRepairForm(EMPTY_REPAIR);
    setShowRepairForm(false);
  };

  return (
    <div style={{ padding: '36px 44px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: 0, marginBottom: 5, letterSpacing: '-0.03em' }}>
            {profile.name || 'My Home'}
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, letterSpacing: '0.01em' }}>
            {profile.homeType && profile.yearBuilt
              ? `${profile.homeType} · Built ${profile.yearBuilt}${profile.sqft ? ` · ${Number(profile.sqft).toLocaleString()} sqft` : ''}${profile.zipCode ? ` · ${profile.zipCode}` : ''}`
              : 'Set up your home profile to get started'}
          </p>
        </div>
        <button
          onClick={() => setEditProfile(true)}
          className="zayd-btn-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            backgroundColor: C.accent, color: C.white,
            border: 'none', borderRadius: 9,
            padding: '9px 18px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.01em',
          }}
        >
          {profile.id ? <><Pencil size={14} />Edit Home</> : <><Plus size={14} />Add Home</>}
        </button>
      </div>

      {/* ── Stat bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 12, marginBottom: 32 }}>
        <StatCard label="HomeDNA Score"     value={score !== null ? score + '/100' : '—'} color={getScoreColor(score)} Icon={ShieldCheck} />
        <StatCard label="Questions"          value={`${answered}/${total}`}                color={C.accent2}            Icon={ClipboardList} />
        <StatCard label="Repairs Logged"    value={repairLog.length}                      color={C.gold}               Icon={Wrench} />
        <StatCard label="Total Spent"       value={fmt(totalExpenses)}                    color={C.red}                Icon={Receipt} />
        {netPL !== 0 && <StatCard label="Net P&L" value={(netPL >= 0 ? '+' : '') + fmt(netPL)} color={netPL >= 0 ? C.green : C.red} Icon={TrendingUp} />}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1.5px solid ${C.border}`, marginBottom: 28 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="zayd-tab"
            style={{
              padding: '9px 20px',
              fontSize: 14,
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? C.accent : C.muted,
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? `2px solid ${C.accent}` : '2px solid transparent',
              marginBottom: -1.5,
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── HomeDNA Score Tab ── */}
      {tab === 'score' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }} className="grid-col-2">

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card style={{ textAlign: 'center', padding: '40px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <ScoreRing score={score} size={128} />
              </div>
              <p style={{ fontSize: 14, color: C.text2, margin: '0 0 20px', lineHeight: 1.65 }}>
                {score === null
                  ? `Answer ${total} safety questions to get your personalized HomeDNA score.`
                  : `${answered} of ${total} questions answered.${total - answered > 0 ? ` Complete ${total - answered} more for a full score.` : ' Assessment complete!'}`}
              </p>
              {!profile.id ? (
                <Btn label="Set up your home first" onClick={() => setEditProfile(true)} variant="outline" icon={<Home size={15} />} />
              ) : (
                <Btn
                  label={score === null ? 'Start HomeDNA Assessment' : 'Retake Assessment'}
                  onClick={startAssessment}
                  icon={score === null ? <ShieldCheck size={15} /> : <RotateCcw size={15} />}
                />
              )}
            </Card>

            {answered > 0 && (
              <Card>
                <SL text="Score by Category" />
                {CATEGORIES.map(cat => {
                  const qs = SAFETY_QUESTIONS.filter(q => q.category === cat && propertyAnswers[q.id] !== undefined);
                  if (!qs.length) return null;
                  const s = Math.round(qs.reduce((a, q) => a + q.weights[propertyAnswers[q.id]], 0) / qs.length);
                  const color = getScoreColor(s);
                  return (
                    <div key={cat} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cat}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color }}>{s}</span>
                      </div>
                      <div style={{ height: 5, backgroundColor: C.s3, borderRadius: 999 }}>
                        <div style={{ height: '100%', backgroundColor: color, borderRadius: 999, width: `${s}%`, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {actionItems.length > 0 ? (
              <Card>
                <SL text={`${actionItems.length} Action Item${actionItems.length > 1 ? 's' : ''}`} />
                {actionItems.map((q, i) => (
                  <React.Fragment key={q.id}>
                    {i > 0 && <HR style={{ margin: '12px 0' }} />}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: C.redL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={16} color={C.red} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: C.red, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{q.category}</p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3, lineHeight: 1.4 }}>{q.question}</p>
                        <p style={{ fontSize: 13, color: C.text2 }}>{q.options[propertyAnswers[q.id]]}</p>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </Card>
            ) : score !== null ? (
              <Card style={{ textAlign: 'center', padding: '40px 28px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: C.greenL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle2 size={26} color={C.green} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: '-0.01em' }}>No urgent action items</p>
                <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.55 }}>Your home is in great shape. Keep up the maintenance!</p>
              </Card>
            ) : (
              <Card style={{ padding: '28px' }}>
                <SL text="How HomeDNA Works" />
                {[
                  { Icon: ShieldCheck,  title: '15 Safety Questions', desc: 'Covering fire safety, HVAC, plumbing, electrical, and more.' },
                  { Icon: ClipboardList, title: 'Personalized Score',  desc: 'Get a 0–100 score with a breakdown by category.' },
                  { Icon: AlertTriangle, title: 'Action Items',        desc: 'See exactly what needs attention and what can wait.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 2 ? 18 : 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: C.accentL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.Icon size={17} color={C.accent} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{item.title}</p>
                      <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Repair Log Tab ── */}
      {tab === 'log' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>
              {repairLog.length} {repairLog.length === 1 ? 'entry' : 'entries'}
            </p>
            <button
              onClick={() => setShowRepairForm(true)}
              className="zayd-btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                backgroundColor: C.accent, color: C.white,
                border: 'none', borderRadius: 9,
                padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              Log Repair
            </button>
          </div>

          {repairLog.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '72px 40px' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Wrench size={26} color={C.muted} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.01em' }}>No repairs logged yet</p>
              <p style={{ fontSize: 14, color: C.text2, maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Track repairs, expenses, and home improvements to build your permanent home record.
              </p>
              <button
                onClick={() => setShowRepairForm(true)}
                className="zayd-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: C.accent, color: C.white, border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                <Plus size={15} />
                Log Your First Repair
              </button>
            </Card>
          ) : (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', backgroundColor: C.surface, boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 56px', gap: 16, padding: '11px 20px', backgroundColor: C.s2, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <span>Description</span><span>Category</span><span>Date</span><span>Amount</span><span></span>
              </div>
              {repairLog.map((r, i) => (
                <div
                  key={r.id}
                  className="zayd-table-row"
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 56px', gap: 16, padding: '14px 20px', borderTop: `1px solid ${C.border}`, alignItems: 'center' }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: r.contractor ? 2 : 0, letterSpacing: '-0.005em' }}>{r.name}</p>
                    {r.contractor && <p style={{ fontSize: 12, color: C.muted }}>{r.contractor}</p>}
                    {r.notes && <p style={{ fontSize: 12, color: C.text2, marginTop: 2, lineHeight: 1.4 }}>{r.notes}</p>}
                  </div>
                  <span>{r.category ? <Pill label={r.category} color={C.accent2} /> : <span style={{ color: C.muted, fontSize: 13 }}>—</span>}</span>
                  <span style={{ fontSize: 13, color: C.text2 }}>{r.date || '—'}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: r.type === 'Income' ? C.green : C.text, letterSpacing: '-0.01em' }}>
                    {r.type === 'Income' ? '+' : '–'}{fmt(r.cost || 0)}
                  </span>
                  <button
                    onClick={() => setDeleteConfirm(r.id)}
                    className="zayd-delete-btn"
                    style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Budget Tab ── */}
      {tab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <BudgetCard label="Total Expenses" value={fmt(totalExpenses)} color={C.red}   sub={`${repairLog.filter(r => r.type !== 'Income').length} expense entries`} />
            <BudgetCard label="Total Income"   value={fmt(totalIncome)}   color={C.green} sub={`${repairLog.filter(r => r.type === 'Income').length} income entries`} />
            <BudgetCard label="Net P&L"        value={(netPL >= 0 ? '+' : '') + fmt(netPL)} color={netPL >= 0 ? C.green : C.red} sub="Lifetime home investment" />
          </div>

          {repairLog.length > 0 && (
            <div>
              <SL text="Breakdown by Category" style={{ marginTop: 4 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                {[...new Set(repairLog.map(r => r.category).filter(Boolean))].map(cat => {
                  const catTotal = repairLog.filter(r => r.category === cat && r.type !== 'Income').reduce((a, r) => a + (r.cost || 0), 0);
                  return (
                    <Card key={cat} style={{ padding: '16px 18px' }}>
                      <p style={{ fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 500 }}>{cat}</p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>{fmt(catTotal)}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HomeDNA Assessment Modal ── */}
      {assessing && (
        <div
          className="zayd-modal-backdrop"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            className="zayd-modal-panel"
            style={{ backgroundColor: C.surface, borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
          >
            <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.accent2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>HomeDNA Assessment</p>
                  <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{SAFETY_QUESTIONS[curQ].category}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{curQ + 1} / {SAFETY_QUESTIONS.length}</span>
                  <button
                    onClick={() => setAssessing(false)}
                    className="zayd-close-btn"
                    style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, background: C.s2, border: 'none', borderRadius: 7, cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div style={{ height: 4, backgroundColor: C.s3, borderRadius: 999 }}>
                <div style={{ height: '100%', backgroundColor: C.accent, borderRadius: 999, width: `${((curQ + 1) / SAFETY_QUESTIONS.length) * 100}%`, transition: 'width 0.35s ease' }} />
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '28px 26px' }}>
              <p style={{ fontSize: 19, fontWeight: 800, color: C.text, lineHeight: 1.45, marginBottom: 22, letterSpacing: '-0.01em' }}>
                {SAFETY_QUESTIONS[curQ].question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {SAFETY_QUESTIONS[curQ].options.map((opt, i) => {
                  const selected = localAnswers[SAFETY_QUESTIONS[curQ].id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => answerQuestion(curQ, i)}
                      className="zayd-option"
                      style={{
                        padding: '13px 17px',
                        borderRadius: 11,
                        border: `2px solid ${selected ? C.accent : C.border}`,
                        backgroundColor: selected ? C.accentL : C.surface,
                        textAlign: 'left',
                        fontSize: 14,
                        fontWeight: selected ? 700 : 400,
                        color: selected ? C.accent : C.text,
                        cursor: 'pointer',
                        lineHeight: 1.4,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => { if (curQ < SAFETY_QUESTIONS.length - 1) setCurQ(curQ + 1); else { saveSafetyAnswers(localAnswers); setAssessing(false); } }}
                style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 16, fontSize: 13, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 8, fontFamily: 'inherit' }}
              >
                Skip this question →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {editProfile && (
        <Modal title={profile.id ? 'Edit Home' : 'Add Your Home'} onClose={() => setEditProfile(false)}>
          <Field label="Home name / address" value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="e.g. 123 Main St" required />
          <Drop label="Home type" value={draft.homeType} options={HOME_TYPES} onChange={v => setDraft(d => ({ ...d, homeType: v }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="grid-col-2">
            <Field label="Year built" value={draft.yearBuilt} onChange={v => setDraft(d => ({ ...d, yearBuilt: v }))} placeholder="1998" numeric />
            <Field label="Square footage" value={draft.sqft} onChange={v => setDraft(d => ({ ...d, sqft: v }))} placeholder="1800" numeric />
          </div>
          <Field label="ZIP code" value={draft.zipCode} onChange={v => setDraft(d => ({ ...d, zipCode: v }))} placeholder="90210" />
          <Btn label="Save Home" onClick={handleSaveProfile} disabled={!draft.name.trim()} />
        </Modal>
      )}

      {/* ── Add Repair Modal ── */}
      {showRepairForm && (
        <Modal title="Log Repair / Expense" onClose={() => setShowRepairForm(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="grid-col-2">
            <Drop label="Type" value={repairForm.type} options={['Expense', 'Income']} onChange={v => setRepairForm(f => ({ ...f, type: v }))} />
            <Drop label="Category" value={repairForm.category} options={CATS} onChange={v => setRepairForm(f => ({ ...f, category: v }))} />
          </div>
          <Field label="Description" value={repairForm.name} onChange={v => setRepairForm(f => ({ ...f, name: v }))} placeholder="e.g. Roof repair" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="grid-col-2">
            <Field label="Cost ($)" value={repairForm.cost} onChange={v => setRepairForm(f => ({ ...f, cost: v }))} placeholder="0.00" numeric />
            <Field label="Date" value={repairForm.date} onChange={v => setRepairForm(f => ({ ...f, date: v }))} placeholder="Jan 15, 2025" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="grid-col-2">
            <Field label="Contractor / Vendor" value={repairForm.contractor} onChange={v => setRepairForm(f => ({ ...f, contractor: v }))} placeholder="Optional" />
            <Field label="Warranty" value={repairForm.warranty} onChange={v => setRepairForm(f => ({ ...f, warranty: v }))} placeholder="e.g. 1 year" />
          </div>
          <Field label="Notes" value={repairForm.notes} onChange={v => setRepairForm(f => ({ ...f, notes: v }))} placeholder="Optional details" multi />
          <Btn label="Save Entry" onClick={handleAddRepair} disabled={!repairForm.name.trim()} />
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <Modal title="Delete Entry?" onClose={() => setDeleteConfirm(null)}>
          <p style={{ fontSize: 14, color: C.text2, marginBottom: 22, lineHeight: 1.6 }}>This entry will be permanently removed from your repair log.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn label="Cancel" onClick={() => setDeleteConfirm(null)} variant="ghost" style={{ flex: 1 }} />
            <Btn label="Delete" onClick={() => { removeRepair(deleteConfirm); setDeleteConfirm(null); }} variant="danger" style={{ flex: 1 }} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, color, Icon }) {
  return (
    <div
      className="zayd-card"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: color + '16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</p>
        <p style={{ fontSize: 19, fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</p>
      </div>
    </div>
  );
}

function BudgetCard({ label, value, color, sub }) {
  return (
    <Card style={{ padding: '26px 28px' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 900, color, marginBottom: 5, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 13, color: C.text2 }}>{sub}</p>
    </Card>
  );
}
