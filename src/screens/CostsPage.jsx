import React, { useState, useRef, useEffect } from 'react';
import { DollarSign, TrendingUp, Hammer, BarChart2, MapPin, FileText, Sparkles, RefreshCw, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { C, fmt } from '../constants/colors';
import { COST_P, ROI_D, REGION_MULT, DIY_INFO, PRI_ISSUES, PRI_CFG, SEV } from '../constants/data';
import { Card, Btn, Field, Drop, Pill, HR, SL, Row } from '../components/shared';
import { resizeImageToBase64 } from '../utils/helpers';

const spin = { animation: 'spin 1s linear infinite' };

function getRegion(zipCode) {
  if (!zipCode || zipCode.length < 1) return null;
  return REGION_MULT[zipCode[0]] || null;
}

function findRelatedRepairs(repairLog, projectType) {
  if (!repairLog || repairLog.length === 0) return [];
  const keyword = projectType.toLowerCase().replace(/\s*[–-]\s*\w+$/, '').trim().split(' ')[0];
  return repairLog.filter(r => (r.name || '').toLowerCase().includes(keyword)).slice(0, 3);
}

export default function CostsPage({ initialMode = 'check', onModeUsed, profile, repairLog }) {
  const [mode, setMode] = useState(initialMode);
  useEffect(() => { setMode(initialMode); if (onModeUsed) onModeUsed(); }, [initialMode]);

  // Quote Checker state
  const [type,  setType]  = useState(Object.keys(COST_P)[0]);
  const [sqft,  setSqft]  = useState('');
  const [quote, setQuote] = useState('');
  const [cr,    setCr]    = useState(null);

  // ROI Calculator state
  const [rType, setRType] = useState(Object.keys(ROI_D)[0]);
  const [rCost, setRCost] = useState('');
  const [hv,    setHv]    = useState('');
  const [rr,    setRr]    = useState(null);

  // DIY tab state
  const [diyType, setDiyType] = useState(Object.keys(DIY_INFO)[0]);

  // Plan tab state
  const [priIssue,      setPriIssue]      = useState(PRI_ISSUES[0]);
  const [priSev,        setPriSev]        = useState(3);
  const [priIncome,     setPriIncome]     = useState('');
  const [priExpenses,   setPriExpenses]   = useState('');
  const [priBudget,     setPriBudget]     = useState('');
  const [priRepairCost, setPriRepairCost] = useState('');
  const [priResult,     setPriResult]     = useState(null);
  const [affordPlan,    setAffordPlan]    = useState(null);
  const [loadingPlan,   setLoadingPlan]   = useState(false);
  const [planErr,       setPlanErr]       = useState('');

  // Quote image state
  const [quoteImg,     setQuoteImg]     = useState(null); // { url, b64 }
  const [analyzingImg, setAnalyzingImg] = useState(false);
  const [imgAnalysis,  setImgAnalysis]  = useState(null);
  const camRef = useRef(null);
  const libRef = useRef(null);

  const region = getRegion(profile?.zipCode);
  const ns = COST_P[type]?.u === 'sqft';
  const relatedRepairs = findRelatedRepairs(repairLog, type);

  const handleQuoteFile = async (file) => {
    if (!file) return;
    const b64 = await resizeImageToBase64(file, 1200);
    const url = URL.createObjectURL(file);
    setQuoteImg({ url, b64 });
    setImgAnalysis(null);
    setCr(null);
  };

  const analyzeQuoteImage = async () => {
    if (!quoteImg) return;
    setAnalyzingImg(true);
    setImgAnalysis(null);
    try {
      const res = await fetch('https://homeowner-api-production.up.railway.app/analyze-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: quoteImg.b64 }),
        signal: AbortSignal.timeout(35000),
      });
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      if (data.amount) setQuote(String(data.amount));
      let matched = false;
      if (data.category) {
        const catMatch = Object.keys(COST_P).find(k => k.toLowerCase() === data.category.toLowerCase());
        if (catMatch) { setType(catMatch); setCr(null); matched = true; }
      }
      if (!matched && data.projectType) {
        const words = data.projectType.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const fuzzy = Object.keys(COST_P).find(k => words.some(w => k.toLowerCase().includes(w)));
        if (fuzzy) { setType(fuzzy); setCr(null); matched = true; }
      }
      setImgAnalysis({ ...data, matched });
    } catch {
      setImgAnalysis({ error: true });
    } finally {
      setAnalyzingImg(false);
    }
  };

  const checkQ = () => {
    if (!quote || (ns && !sqft)) return;
    const d = COST_P[type];
    const m = region?.mult || 1;
    const low  = Math.round((ns ? d.low  * parseFloat(sqft) : d.low)  * m);
    const high = Math.round((ns ? d.high * parseFloat(sqft) : d.high) * m);
    const q = parseFloat(quote);
    if (q < low * 0.85)
      setCr({ v:'Suspiciously Low', c:C.yellow, bg:C.yellowL, low, high, msg:`${Math.round((low - q) / low * 100)}% below market — verify materials and license` });
    else if (q > high * 1.15)
      setCr({ v:'Overpriced', c:C.red, bg:C.redL, low, high, msg:`${Math.round((q - high) / high * 100)}% above market — negotiate or get 2–3 more quotes` });
    else if (q <= low * 1.08)
      setCr({ v:'Great Deal', c:C.green, bg:C.greenL, low, high, msg:'At or below fair market rate — this quote looks solid' });
    else
      setCr({ v:'Fair Price', c:C.accent2, bg:C.accentL, low, high, msg:'Within normal market range for this type of project' });
  };

  const calcRoi = () => {
    if (!rCost) return;
    const d = ROI_D[rType], cost = parseFloat(rCost), homeVal = parseFloat(hv) || 0;
    const va  = Math.round(d.av * (cost / d.ac));
    const roi = parseFloat(((va / cost) * 100).toFixed(1));
    const ng  = va - cost;
    setRr({ va, roi, ng, cost, nv: homeVal ? homeVal + va : null, nRoi: d.roi, nCost: d.ac, nVal: d.av });
  };

  const calcPriority = () => {
    const income     = parseFloat(priIncome)     || 0;
    const expenses   = parseFloat(priExpenses)   || 0;
    const budget     = parseFloat(priBudget)     || 0;
    const repairCost = parseFloat(priRepairCost) || 0;
    if (!income && !budget) { setPlanErr('Enter your available repair budget to get a personalized priority score.'); return; }
    setPlanErr('');
    const ratio = budget > 0 && repairCost > 0 ? repairCost / budget : 1;
    let financialStress = 0;
    if (ratio > 2)        financialStress = 40;
    else if (ratio > 1)   financialStress = 30;
    else if (ratio > 0.5) financialStress = 15;
    else                  financialStress = 5;
    const severityScore = priSev * 6;
    let urgency = 10;
    if (['Roof damage','Foundation cracks','Electrical issues','Water damage / mold','Structural damage','Plumbing leak'].includes(priIssue)) urgency = 30;
    else if (['HVAC failure','Insulation problems','Window/door issues'].includes(priIssue)) urgency = 20;
    const total = Math.min(100, financialStress + severityScore + urgency);
    const level = total >= 65 ? 'high' : total >= 35 ? 'medium' : 'low';
    let advice = '';
    if (ratio > 1.5 && level === 'high') advice = "This repair is urgent but exceeds your current budget. Get 2-3 quotes now and ask about payment plans. Delaying a critical repair can cost significantly more.";
    else if (ratio > 1.5 && level !== 'high') advice = "This repair isn't immediately critical. Save for it over the next 2-3 months before tackling it.";
    else if (ratio <= 1 && level === 'high') advice = "You have the budget and this is urgent. Address it this week — get quotes immediately.";
    else if (ratio <= 1 && level === 'medium') advice = "You can afford this and it should be addressed within the next 1-3 months. Schedule it now.";
    else advice = "Low priority and affordable. Schedule it when convenient — within 6 months is fine.";
    setPriResult({ score: total, level, advice, ratio, budget, repairCost });
    setAffordPlan(null);
  };

  const fetchAffordPlan = async () => {
    if (!priResult) return;
    setLoadingPlan(true);
    setAffordPlan(null);
    setPlanErr('');
    try {
      const res = await fetch('https://homeowner-api-production.up.railway.app/repair-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue:         priIssue,
          severity:      priSev,
          repairCost:    parseFloat(priRepairCost) || 0,
          income:        parseFloat(priIncome)     || 0,
          expenses:      parseFloat(priExpenses)   || 0,
          budget:        parseFloat(priBudget)     || 0,
          priorityScore: priResult.score,
          priorityLevel: priResult.level,
        }),
        signal: AbortSignal.timeout(35000),
      });
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      setAffordPlan(data.plan);
    } catch (e) {
      setPlanErr(e.message || 'Could not get plan.');
    } finally {
      setLoadingPlan(false);
    }
  };

  // DIY computed
  const diyInfo      = DIY_INFO[diyType];
  const diyDiffColor = !diyInfo ? C.muted : diyInfo.diff <= 2 ? C.green : diyInfo.diff <= 3 ? C.yellow : C.red;
  const diyDiffLabel = !diyInfo ? '' : ['','Very Easy','Easy','Moderate','Hard','Expert Only'][diyInfo.diff];
  const diyRecColor  = !diyInfo ? C.muted
    : diyInfo.rec === 'DIY Friendly' ? C.green
    : (diyInfo.rec === 'Always Hire' || diyInfo.rec === 'Hire a Pro') ? C.red
    : C.yellow;

  const TABS = [
    { id: 'check', label: 'Quote',   Icon: DollarSign  },
    { id: 'roi',   label: 'ROI Calc',Icon: TrendingUp  },
    { id: 'diy',   label: 'DIY?',    Icon: Hammer      },
    { id: 'plan',  label: 'Plan',    Icon: BarChart2   },
  ];

  return (
    <div style={{ padding: '28px 24px 48px', maxWidth: 700, margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.02em', marginBottom: 4 }}>Cost Tools</p>
        <p style={{ fontSize: 13, color: C.muted }}>Check quotes · Calculate ROI · DIY vs Hire · Plan</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', backgroundColor: C.s2, borderRadius: 12, padding: 4, marginBottom: 22, gap: 2 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setMode(id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '8px 6px', borderRadius: 9, border: 'none', cursor: 'pointer',
            backgroundColor: mode === id ? C.surface : 'transparent',
            color: mode === id ? C.accent : C.muted,
            fontSize: 12, fontWeight: mode === id ? 700 : 500,
            boxShadow: mode === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── QUOTE CHECKER ─────────────────────────────────────────────── */}
      {mode === 'check' && (
        <>
          <p style={{ fontSize: 13, color: C.text2, marginBottom: 18, lineHeight: 1.6 }}>
            {region
              ? `Is your contractor quote fair? Prices adjusted for ${region.label}.`
              : 'Is your contractor quote fair? Compare against national market data.'}
          </p>

          {region && (
            <div style={{ backgroundColor: C.accentL, borderRadius: 10, padding: 12, marginBottom: 14, border: `1px solid ${C.accent}28`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={15} color={C.accent} />
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>
                {region.label} pricing (ZIP {profile?.zipCode || ''}) · {region.mult > 1 ? '+' : ''}{Math.round((region.mult - 1) * 100)}% vs national avg
              </span>
            </div>
          )}

          {/* Quote image upload */}
          <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleQuoteFile(e.target.files?.[0])} />
          <input ref={libRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleQuoteFile(e.target.files?.[0])} />

          {quoteImg ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}`, background: '#000', height: 200 }}>
                <img src={quoteImg.url} alt="quote" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <button onClick={() => { setQuoteImg(null); setImgAnalysis(null); }} style={{
                  position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)',
                  border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
                  color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
                <button onClick={analyzeQuoteImage} disabled={analyzingImg} style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.7)', border: 'none', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: analyzingImg ? 'default' : 'pointer', color: '#fff',
                }}>
                  {analyzingImg ? <Loader2 size={18} style={spin} /> : <Sparkles size={18} />}
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{analyzingImg ? 'Reading quote...' : 'Extract Quote Details'}</span>
                </button>
              </div>

              {imgAnalysis && !imgAnalysis.error && (
                <div style={{ backgroundColor: C.accentL, borderRadius: 12, padding: 14, border: `1px solid ${C.accent}28`, marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <CheckCircle size={16} color={C.accent} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>Quote extracted</span>
                  </div>
                  {imgAnalysis.projectType && <p style={{ fontSize: 12, color: C.text, fontWeight: 600, marginBottom: 2 }}>{imgAnalysis.projectType}</p>}
                  {imgAnalysis.contractor && <p style={{ fontSize: 12, color: C.text2 }}>Contractor: {imgAnalysis.contractor}</p>}
                  {imgAnalysis.notes && <p style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{imgAnalysis.notes}</p>}
                  {!imgAnalysis.matched && (
                    <div style={{ marginTop: 10, backgroundColor: C.yellowL, borderRadius: 8, padding: 10, border: `1px solid ${C.yellow}40` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertCircle size={14} color={C.yellow} />
                        <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>No exact category match — please select the closest project type from the dropdown below.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {imgAnalysis?.error && (
                <div style={{ backgroundColor: C.yellowL, borderRadius: 12, padding: 14, border: `1px solid ${C.yellow}40`, marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} color={C.yellow} />
                    <span style={{ fontSize: 13, color: C.text2 }}>Couldn't read the quote automatically — enter the amount below.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div onClick={() => libRef.current?.click()} style={{
              marginBottom: 14, border: `2px dashed ${C.accent}40`, borderRadius: 14, padding: '20px 16px',
              cursor: 'pointer', textAlign: 'center', backgroundColor: C.accentL,
            }}>
              <FileText size={26} color={C.accent} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 4 }}>Upload Quote Screenshot</p>
              <p style={{ fontSize: 12, color: C.muted }}>Tap to add a photo or screenshot of your contractor quote</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                <button onClick={e => { e.stopPropagation(); camRef.current?.click(); }} style={{
                  background: C.accent, color: '#fff', border: 'none', borderRadius: 8,
                  padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Take Photo</button>
                <button onClick={e => { e.stopPropagation(); libRef.current?.click(); }} style={{
                  background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Choose File</button>
              </div>
            </div>
          )}

          <Card>
            <Drop label="Project Type" value={type} options={Object.keys(COST_P)} onChange={t => { setType(t); setCr(null); }} />
            {ns && <Field label="Square Footage" value={sqft} onChange={t => { setSqft(t); setCr(null); }} placeholder="e.g. 800" numeric />}
            <Field label="Contractor Quote ($)" value={quote} onChange={t => { setQuote(t); setCr(null); }} placeholder="e.g. 4,200" numeric />
            <Btn label="Check This Quote" onPress={checkQ} disabled={!quote || (ns && !sqft)} />
          </Card>

          {cr && (
            <>
              <Card style={{ backgroundColor: cr.bg, borderColor: cr.c + '28', marginTop: 12 }}>
                <Pill label={cr.v} color={cr.c} />
                <p style={{ fontSize: 28, fontWeight: 900, color: cr.c, margin: '11px 0 5px' }}>{cr.v}</p>
                <p style={{ fontSize: 13, color: C.text2, marginBottom: 14 }}>
                  Market range: {fmt(cr.low)} – {fmt(cr.high)}{ns ? '/sqft' : ''}{region ? ` (${region.label})` : ''}
                </p>
                <HR />
                <p style={{ fontSize: 15, color: C.text, fontWeight: 500, lineHeight: 1.6, marginTop: 12 }}>{cr.msg}</p>
              </Card>

              {DIY_INFO[type] && (
                <div onClick={() => { setDiyType(type); setMode('diy'); }} style={{
                  backgroundColor: C.s2, borderRadius: 13, padding: 14, border: `1.5px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, cursor: 'pointer',
                }}>
                  <div style={{ width: 40, height: 40, backgroundColor: C.accentL, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Hammer size={20} color={C.accent} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                      {DIY_INFO[type].rec === 'DIY Friendly' ? 'This is a great DIY project'
                        : DIY_INFO[type].rec === 'Always Hire' ? 'This one always needs a pro'
                        : `DIY difficulty: ${DIY_INFO[type].rec}`}
                    </p>
                    <p style={{ fontSize: 12, color: C.muted }}>Tap to see full DIY vs Hire breakdown →</p>
                  </div>
                </div>
              )}

              {relatedRepairs.length > 0 && (
                <Card>
                  <SL text="Your Repair History" />
                  {relatedRepairs.map((r, i) => (
                    <div key={r.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: i < relatedRepairs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ flex: 1, marginRight: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.name}</p>
                        {r.date && <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{r.date}</p>}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>{fmt(r.cost)}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 1.6 }}>Your past costs on similar work. Scope, materials, and contractor vary.</p>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* ── ROI CALCULATOR ──────────────────────────────────────────────── */}
      {mode === 'roi' && (
        <>
          <p style={{ fontSize: 13, color: C.text2, marginBottom: 18, lineHeight: 1.6 }}>
            See the return on your renovation. Based on the 2024 Cost vs. Value Report.
          </p>
          <Card>
            <Drop label="Project Type" value={rType} options={Object.keys(ROI_D)} onChange={t => { setRType(t); setRr(null); }} />
            <Field label="Your Project Cost ($)" value={rCost} onChange={t => { setRCost(t); setRr(null); }} placeholder="e.g. 15,000" numeric />
            <Field label="Current Home Value ($ optional)" value={hv} onChange={t => { setHv(t); setRr(null); }} placeholder="e.g. 350,000" numeric hint="Shows your projected new value after the renovation." />
            <Btn label="Calculate ROI" onPress={calcRoi} disabled={!rCost} />
          </Card>

          {rr && (
            <>
              <Card style={{ backgroundColor: C.accent, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2, marginBottom: 5 }}>VALUE ADDED</p>
                    <p style={{ fontSize: 32, fontWeight: 900, color: C.white }}>{fmt(rr.va)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2, marginBottom: 5 }}>ROI</p>
                    <p style={{ fontSize: 32, fontWeight: 900, color: C.white }}>{rr.roi}%</p>
                  </div>
                </div>
                <HR style={{ borderColor: 'rgba(255,255,255,0.18)' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  {[
                    ['YOUR COST', fmt(rr.cost), C.white],
                    ['NET GAIN', (rr.ng >= 0 ? '+' : '') + fmt(rr.ng), rr.ng >= 0 ? '#A8E6CF' : '#FFB3B3'],
                    rr.nv ? ['NEW VALUE', fmt(rr.nv), '#A8E6CF'] : null,
                  ].filter(Boolean).map(([l, v, c]) => (
                    <div key={l} style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.1, marginBottom: 5, fontWeight: 700 }}>{l}</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card style={{ marginTop: 12 }}>
                <SL text="National Benchmark (2024)" />
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  {[['AVG COST', fmt(rr.nCost)], ['AVG RETURN', fmt(rr.nVal)], ["NAT'L ROI", `${rr.nRoi}%`]].map(([l, v]) => (
                    <div key={l} style={{ flex: 1, backgroundColor: C.s2, borderRadius: 12, padding: 13, textAlign: 'center' }}>
                      <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: 1.1, marginBottom: 5 }}>{l}</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{v}</p>
                    </div>
                  ))}
                </div>
                <HR />
                <div style={{ backgroundColor: rr.roi >= 80 ? C.greenL : rr.roi >= 60 ? C.accentL : rr.roi >= 40 ? C.yellowL : C.redL, borderRadius: 12, padding: 14, margin: '12px 0' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                    {rr.roi >= 80 ? '🏆 Excellent investment' : rr.roi >= 60 ? '✅ Good investment' : rr.roi >= 40 ? '⚠️ Moderate return' : '📉 Low return'}
                  </p>
                  <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>
                    {rr.roi >= 80
                      ? `This project returns ${rr.roi}% of its cost in home value — well above the national average. A strong investment whether you plan to sell soon or long-term.`
                      : rr.roi >= 60
                      ? `This project returns ${rr.roi}% of its cost. Solid value — especially if it improves your quality of life while you live there.`
                      : rr.roi >= 40
                      ? `This project returns ${rr.roi}% of its cost. Worth doing for livability, but don't rely on it for resale value alone.`
                      : `This project returns only ${rr.roi}% of its cost in resale value. Do it for quality of life — not as a financial investment.`}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: C.s2, borderRadius: 12, padding: 14 }}>
                  <Clock size={20} color={C.accent} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                      {rr.ng >= 0 ? `You gain ${fmt(rr.ng)} immediately` : `Cost exceeds return by ${fmt(Math.abs(rr.ng))}`}
                    </p>
                    <p style={{ fontSize: 12, color: C.muted }}>
                      {rr.ng >= 0 ? 'Value added exceeds your project cost — immediate equity gain' : 'You gain livability but not full dollar-for-dollar return'}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 13, lineHeight: 1.6 }}>
                  Source: 2024 Cost vs. Value Report, Remodeling Magazine. Results vary by location, materials, and market conditions.
                </p>
              </Card>
            </>
          )}
        </>
      )}

      {/* ── DIY VS HIRE ─────────────────────────────────────────────────── */}
      {mode === 'diy' && (
        <>
          <p style={{ fontSize: 13, color: C.text2, marginBottom: 18, lineHeight: 1.6 }}>
            Should you DIY or hire a contractor? See difficulty, time, and how much you could save.
          </p>

          <Card>
            <Drop label="Project Type" value={diyType} options={Object.keys(DIY_INFO)} onChange={v => setDiyType(v)} />
          </Card>

          {diyInfo && (
            <>
              <Card style={{ alignItems: 'center', padding: 28, backgroundColor: diyRecColor + '10', borderColor: diyRecColor + '30', marginTop: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: diyRecColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Hammer size={30} color={diyRecColor} />
                </div>
                <Pill label={diyInfo.rec} color={diyRecColor} />
                <p style={{ fontSize: 13, color: C.text2, textAlign: 'center', lineHeight: 1.6, marginTop: 12 }}>{diyInfo.why}</p>
              </Card>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <Card style={{ flex: 1, alignItems: 'center', padding: 16 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: 1.2, marginBottom: 8 }}>DIFFICULTY</p>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: n <= diyInfo.diff ? diyDiffColor : C.border }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: diyDiffColor }}>{diyDiffLabel}</p>
                </Card>
                <Card style={{ flex: 1, alignItems: 'center', padding: 16 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: 1.2, marginBottom: 8 }}>TIME</p>
                  <Clock size={18} color={C.accent} style={{ marginBottom: 4 }} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.text, textAlign: 'center' }}>{diyInfo.hrs}</p>
                </Card>
              </div>

              <Card style={{ marginTop: 12 }}>
                <SL text="Labor vs Materials Split" />
                <div style={{ backgroundColor: C.s2, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: C.text2 }}>Materials (what you buy)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{diyInfo.pct}% of total</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: C.text2 }}>Labor (what you skip by DIYing)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{100 - diyInfo.pct}% of total</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ height: 8, width: `${diyInfo.pct}%`, backgroundColor: C.accent, borderRadius: 4 }} />
                  </div>
                  {COST_P[diyType] && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Est. DIY savings</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: C.green }}>
                        {fmt(Math.round((1 - diyInfo.pct / 100) * (COST_P[diyType].low + COST_P[diyType].high) / 2))}
                        {COST_P[diyType].u === 'sqft' ? '/sqft+' : '+'}
                      </span>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                  Estimate based on typical labor/materials split. Actual savings depend on your tools, experience, and rental costs.
                </p>
              </Card>

              <div onClick={() => { if (COST_P[diyType]) setType(diyType); setMode('check'); }} style={{
                backgroundColor: C.s2, borderRadius: 13, padding: 14, border: `1.5px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, cursor: 'pointer',
              }}>
                <div style={{ width: 40, height: 40, backgroundColor: C.accentL, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DollarSign size={20} color={C.accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Check a contractor quote →</p>
                  <p style={{ fontSize: 12, color: C.muted }}>See if what you were quoted is fair</p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── REPAIR PLAN ─────────────────────────────────────────────────── */}
      {mode === 'plan' && (
        <>
          <p style={{ fontSize: 13, color: C.text2, marginBottom: 18, lineHeight: 1.6 }}>
            Tell us about your repair and budget. We'll calculate a priority score and use AI to build a personalized affordability plan.
          </p>

          <Card>
            <SL text="Your Financial Picture" />
            <Field label="Monthly take-home pay ($)" value={priIncome} onChange={t => { setPriIncome(t); setPriResult(null); setAffordPlan(null); }} placeholder="e.g. 4,500" numeric />
            <Field label="Monthly expenses ($)" value={priExpenses} onChange={t => { setPriExpenses(t); setPriResult(null); setAffordPlan(null); }} placeholder="e.g. 3,200" numeric hint="Rent/mortgage, food, bills, etc." />
            <Field label="Available repair budget ($)" value={priBudget} onChange={t => { setPriBudget(t); setPriResult(null); setAffordPlan(null); }} placeholder="e.g. 800" numeric hint="What you can spend on repairs right now" />
          </Card>

          <Card style={{ marginTop: 12 }}>
            <SL text="The Repair" />
            <Drop label="Issue Type" value={priIssue} options={PRI_ISSUES} onChange={v => { setPriIssue(v); setPriResult(null); setAffordPlan(null); }} />

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8 }}>Severity</p>
              <div style={{ display: 'flex', gap: 5 }}>
                {SEV.map(item => (
                  <button key={item.n} onClick={() => { setPriSev(item.n); setPriResult(null); setAffordPlan(null); }} style={{
                    flex: 1, padding: '10px 4px', borderRadius: 10,
                    border: `1.5px solid ${priSev === item.n ? C.accent : C.border}`,
                    backgroundColor: priSev === item.n ? C.accent : C.surface,
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}>
                    <span style={{ fontSize: 17, fontWeight: 900, color: priSev === item.n ? '#fff' : C.text }}>{item.n}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: priSev === item.n ? 'rgba(255,255,255,0.7)' : C.muted }}>{item.l.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Estimated repair cost ($)" value={priRepairCost} onChange={t => { setPriRepairCost(t); setPriResult(null); setAffordPlan(null); }} placeholder="e.g. 1,200" numeric />

            {planErr && !priResult && (
              <div style={{ backgroundColor: C.yellowL, borderRadius: 10, padding: 12, marginBottom: 12, border: `1px solid ${C.yellow}40` }}>
                <p style={{ fontSize: 13, color: C.text2 }}>{planErr}</p>
              </div>
            )}

            <Btn label="Calculate Priority" onPress={calcPriority} />
          </Card>

          {priResult && (() => {
            const cfg = PRI_CFG[priResult.level];
            return (
              <>
                <Card style={{ backgroundColor: cfg.bg, borderColor: cfg.color + '28', marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <Pill label={cfg.label} color={cfg.color} />
                      <p style={{ fontSize: 56, fontWeight: 900, color: C.text, lineHeight: 1.1, marginTop: 8 }}>
                        {priResult.score}<span style={{ fontSize: 18, color: C.muted, fontWeight: 400 }}>/100</span>
                      </p>
                      <p style={{ fontSize: 12, color: C.muted }}>Priority Score</p>
                    </div>
                    <BarChart2 size={44} color={cfg.color} style={{ opacity: 0.7 }} />
                  </div>

                  <div style={{ height: 7, backgroundColor: cfg.color + '28', borderRadius: 4, marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{ height: 7, width: `${priResult.score}%`, backgroundColor: cfg.color, borderRadius: 4 }} />
                  </div>

                  {priResult.budget > 0 && (
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                      {[
                        ['Repair cost', `$${priResult.repairCost.toLocaleString()}`, C.text],
                        ['Available budget', `$${priResult.budget.toLocaleString()}`, priResult.ratio <= 1 ? C.green : C.red],
                        ['Budget coverage', priResult.ratio <= 1 ? '✓ Covered' : `${Math.round((priResult.ratio - 1) * 100)}% over budget`, priResult.ratio <= 1 ? C.green : C.red],
                      ].map(([l, v, c]) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>{l}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <HR />
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, fontWeight: 500, marginTop: 12 }}>{priResult.advice}</p>
                </Card>

                <Card style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, backgroundColor: C.accentL, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={18} color={C.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>AI Affordability Plan</p>
                      <p style={{ fontSize: 12, color: C.muted }}>Personalized step-by-step plan to afford this repair</p>
                    </div>
                  </div>

                  {!affordPlan && !loadingPlan && (
                    <Btn label="Get Affordability Plan" onPress={fetchAffordPlan} />
                  )}

                  {loadingPlan && (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <Loader2 size={24} color={C.accent} style={spin} />
                      <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Analyzing your situation...</p>
                    </div>
                  )}

                  {planErr && !loadingPlan && affordPlan === null && priResult && (
                    <div style={{ backgroundColor: C.yellowL, borderRadius: 10, padding: 12, border: `1px solid ${C.yellow}40` }}>
                      <p style={{ fontSize: 13, color: C.text2 }}>{planErr}</p>
                    </div>
                  )}

                  {affordPlan && (
                    <>
                      <div style={{ backgroundColor: C.accentL, borderRadius: 12, padding: 16, border: `1px solid ${C.accent}28`, marginTop: 4 }}>
                        <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }}>{affordPlan}</p>
                      </div>
                      <button onClick={() => { setAffordPlan(null); fetchAffordPlan(); }} style={{
                        marginTop: 10, alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 4,
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}>
                        <RefreshCw size={13} color={C.muted} />
                        <span style={{ fontSize: 12, color: C.muted }}>Regenerate</span>
                      </button>
                    </>
                  )}
                </Card>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
