import React, { useState, useRef } from 'react';
import { Search, Camera, Images, Hammer, MapPin, Phone, ExternalLink, Share2, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { C, fmt } from '../constants/colors';
import { BACKEND, FREE_LIMIT, PRI_COLOR, PRI_BG, PRI_LABEL, SCR_LABEL, scColor, STARS } from '../constants/data';
import { Card, Btn, SecBtn, SL, Row, HR } from '../components/shared';
import { resizeImageToBase64 } from '../utils/helpers';

export default function InspectPage({ profile, checkUsage, aiUsage, isPro, onShowPaywall, onNavigateCosts }) {
  const [img, setImg]             = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [err, setErr]             = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [diyResult, setDiyResult] = useState({});
  const [diyLoading, setDiyLoading] = useState({});
  const [conResult, setConResult] = useState({});
  const [conLoading, setConLoading] = useState({});
  const [zipInputs, setZipInputs] = useState({});
  const [sharing, setSharing]     = useState({});

  const camRef = useRef();
  const libRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setResult(null); setErr(null); setExpanded(null); setDiyResult({}); setConResult({});
    const b64 = await resizeImageToBase64(file, 1400);
    setImg({ url: URL.createObjectURL(file), b64 });
  };

  const analyze = async () => {
    if (checkUsage) { const ok = await checkUsage(); if (!ok) return; }
    setLoading(true); setResult(null); setErr(null);
    const ctx = profile.yearBuilt
      ? `Home: ${profile.homeType}, built ${profile.yearBuilt}, ${profile.sqft} sqft, ZIP ${profile.zipCode}.` : '';
    try {
      const res = await fetch(`${BACKEND}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img.b64, mediaType: 'image/jpeg', homeContext: ctx }),
        signal: AbortSignal.timeout(35000),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setResult(await res.json());
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const getDiy = async (iss, idx) => {
    setDiyLoading(p => ({ ...p, [idx]: true }));
    try {
      const res = await fetch(`${BACKEND}/diy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueName: iss.name, description: iss.description, estimatedCost: Math.round((iss.costLow + iss.costHigh) / 2) }),
        signal: AbortSignal.timeout(35000),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      if (!data?.steps?.length) throw new Error('Invalid response. Please try again.');
      setDiyResult(p => ({ ...p, [idx]: data }));
    } catch (e) { setErr(e.message); }
    finally { setDiyLoading(p => ({ ...p, [idx]: false })); }
  };

  const findPros = async (iss, idx) => {
    const zip = zipInputs[idx] || profile.zipCode;
    if (!zip || zip.length < 5) { setErr('Enter a ZIP code to find contractors.'); return; }
    setConLoading(p => ({ ...p, [idx]: true }));
    try {
      const res = await fetch(`${BACKEND}/contractors`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueType: iss.name, zipCode: zip }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      setConResult(p => ({ ...p, [idx]: data }));
    } catch (e) { setErr(e.message); }
    finally { setConLoading(p => ({ ...p, [idx]: false })); }
  };

  const shareReport = async (iss, idx) => {
    setSharing(p => ({ ...p, [idx]: true }));
    const diy = diyResult[idx], cons = conResult[idx];
    let r = `HOME REPAIR ESTIMATE\nZayd AI Home Inspector\n${'─'.repeat(32)}\n\n`;
    if (profile.name) r += `Property: ${profile.name}\n`;
    if (profile.zipCode) r += `Location: ${profile.zipCode}\n`;
    if (profile.yearBuilt) r += `Built: ${profile.yearBuilt}\n\n`;
    r += `ISSUE: ${iss.name}\nPriority: ${PRI_LABEL[iss.priority]}\n${iss.description}\nEstimate: ${fmt(iss.costLow)} – ${fmt(iss.costHigh)}\n\n`;
    if (diy) {
      r += `DIY: ${SCR_LABEL[diy.diyScore]}/5  |  Savings: ${fmt(diy.savings || 0)}  |  Time: ${diy.timeEstimate}\n\n`;
      if (diy.steps?.length) { r += `STEPS:\n`; diy.steps.forEach(st => { r += `${st.step}. ${st.title}\n   ${st.detail}\n`; }); r += '\n'; }
    }
    if (cons?.businesses?.length) {
      r += `TOP CONTRACTORS:\n`;
      cons.businesses.slice(0, 3).forEach(b => { r += `• ${b.name} — ${b.rating}★ (${b.reviewCount} reviews)${b.phone ? ' — ' + b.phone : ''}\n`; });
    }
    r += `\n${'─'.repeat(32)}\nUS national averages. Get 2–3 quotes.\nZayd AI`;
    try {
      if (navigator.share) await navigator.share({ text: r, title: `Repair Estimate: ${iss.name}` });
      else { await navigator.clipboard.writeText(r); }
    } catch (_) {}
    setSharing(p => ({ ...p, [idx]: false }));
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>AI Inspector</h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Photo → instant repair estimate</p>
        </div>
        {!isPro && (
          <button onClick={onShowPaywall} style={{
            backgroundColor: aiUsage >= FREE_LIMIT ? C.redL : C.accentL,
            border: `1px solid ${aiUsage >= FREE_LIMIT ? C.red + '50' : C.accent + '50'}`,
            borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: aiUsage >= FREE_LIMIT ? C.red : C.accent }}>
              {aiUsage}/{FREE_LIMIT} free
            </span>
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      <input ref={libRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

      {/* Landing / hero */}
      {!img && !result && (
        <>
          <div style={{
            background: `linear-gradient(135deg, ${C.dark} 0%, #0d2218 100%)`,
            borderRadius: 22, padding: 28, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)' }} />
            <div style={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Search size={28} color={C.white} />
            </div>
            <p style={{ fontSize: 22, fontWeight: 900, color: C.white, letterSpacing: '-0.03em', marginBottom: 8 }}>AI Home Inspector</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 22 }}>
              Photograph any issue — roof damage, water stains, cracks, mold, broken fixtures. Get an instant repair estimate with DIY guides and local contractors.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => camRef.current.click()} style={{
                flex: 1, backgroundColor: C.white, borderRadius: 13, padding: '14px 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: C.accent,
              }}>
                <Camera size={18} /> Take Photo
              </button>
              <button onClick={() => libRef.current.click()} style={{
                flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 13, padding: '14px 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: C.white,
              }}>
                <Images size={18} /> Upload
              </button>
            </div>
          </div>

          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginTop: 4 }}>How It Works</p>
          {[
            { Icon: Camera,   title: 'Take a photo',         desc: 'Any visible damage — roof, walls, floors, plumbing, electrical' },
            { Icon: Search,   title: 'AI analyzes instantly', desc: 'Claude inspects like a professional home inspector' },
            { Icon: Hammer,   title: 'Get a cost estimate',   desc: 'Real repair costs based on US national averages' },
            { Icon: MapPin,   title: 'DIY or hire a pro',     desc: 'Step-by-step guide or top-rated local contractors via Yelp' },
          ].map(({ Icon, title, desc }, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 42, height: 42, backgroundColor: C.accentL, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={C.accent} />
              </div>
              <div style={{ paddingTop: 2 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{title}</p>
                <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}

          <Card style={{ backgroundColor: C.s2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Tips for best results</p>
            </div>
            {['Good lighting — natural light works best', 'Show the full damage area, not just the center', 'Multiple angles help for complex issues', 'Include surrounding context (nearby pipes, walls, etc)'].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: i < 3 ? 8 : 0 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: C.accent, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: C.text2 }}>{tip}</p>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* Image preview */}
      {img && (
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 240, backgroundColor: C.s3 }}>
          <img src={img.url} alt="inspection" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <button onClick={() => { setImg(null); setResult(null); setErr(null); }} style={{
            position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 16,
          }}>✕</button>
          {!result && !loading && (
            <button onClick={analyze} style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              backgroundColor: C.accent, color: C.white, border: 'none', borderRadius: 13,
              padding: '13px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}>
              <Search size={18} /> Analyze for Issues & Costs
            </button>
          )}
        </div>
      )}

      {img && !result && !loading && (
        <div style={{ display: 'flex', gap: 10 }}>
          <SecBtn label="Camera" icon={<Camera size={13} />} onClick={() => camRef.current.click()} />
          <SecBtn label="Library" icon={<Images size={13} />} onClick={() => libRef.current.click()} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
          <Loader2 size={36} color={C.accent} style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 5 }}>Analyzing your photo…</p>
          <p style={{ fontSize: 13, color: C.muted }}>
            {profile.yearBuilt ? `Using your ${profile.yearBuilt} ${profile.homeType?.toLowerCase()} profile` : 'Identifying issues and estimating costs'}
          </p>
        </Card>
      )}

      {/* Error */}
      {!!err && (
        <Card style={{ backgroundColor: C.redL, borderColor: C.red + '50' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertTriangle size={20} color={C.red} />
            <p style={{ color: C.red, fontSize: 14, fontWeight: 600 }}>{err}</p>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Summary banner */}
          <div style={{
            background: `linear-gradient(135deg, ${C.accent} 0%, #1A5C3F 100%)`,
            borderRadius: 16, padding: '20px 22px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>TOTAL ESTIMATE</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: C.white, letterSpacing: '-0.03em' }}>{fmt(result.totalLow)} – {fmt(result.totalHigh)}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
                {result.confidence === 'high' ? 'High confidence' : result.confidence === 'low' ? 'Low confidence — verify on-site' : 'Moderate confidence'}
              </p>
            </div>
            <div style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 18px' }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: C.white, lineHeight: 1 }}>{result.issues?.length || 0}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>issue{result.issues?.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {result.summary && <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>{result.summary}</p>}

          {onNavigateCosts && (
            <button onClick={() => onNavigateCosts('check')} style={{
              backgroundColor: C.s2, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', width: '100%',
            }}>
              <span style={{ fontSize: 16 }}>💰</span>
              <span style={{ fontSize: 13, color: C.accent, fontWeight: 700, flex: 1, textAlign: 'left' }}>Got a quote? Check if it's fair →</span>
            </button>
          )}

          <SL text="Identified Issues" />

          {result.issues?.map((iss, idx) => {
            const isExp = expanded === idx;
            const diy = diyResult[idx], cons = conResult[idx];
            const pc = PRI_COLOR[iss.priority] || C.muted;
            const pb = PRI_BG[iss.priority] || C.s2;

            return (
              <Card key={idx} style={{ padding: 0, overflow: 'hidden' }}>
                {/* Issue header */}
                <button
                  onClick={() => setExpanded(isExp ? null : idx)}
                  style={{ width: '100%', padding: 18, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        backgroundColor: pb, color: pc,
                        border: `1px solid ${pc}40`, borderRadius: 8,
                        padding: '3px 9px', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                        display: 'inline-block', marginBottom: 10,
                      }}>{PRI_LABEL[iss.priority] || iss.priority}</span>
                      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 5 }}>{iss.name}</p>
                      <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{iss.description}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 18, fontWeight: 900, color: C.accent }}>{fmt(iss.costLow)}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>to {fmt(iss.costHigh)}</p>
                      <div style={{ marginTop: 10, color: C.muted }}>{isExp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {isExp && (
                  <div style={{ borderTop: `1px solid ${C.border}` }}>
                    {/* Action chooser */}
                    {!diy && cons !== 'show-zip' && !cons?.businesses && (
                      <div style={{ padding: 18 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, marginBottom: 14 }}>What would you like to do?</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            onClick={() => getDiy(iss, idx)}
                            disabled={diyLoading[idx]}
                            style={{ flex: 1, backgroundColor: C.accentL, border: `1px solid ${C.accent}28`, borderRadius: 13, padding: 16, cursor: 'pointer', textAlign: 'center' }}
                          >
                            {diyLoading[idx]
                              ? <Loader2 size={22} color={C.accent} style={{ margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
                              : <Hammer size={22} color={C.accent} style={{ margin: '0 auto 8px', display: 'block' }} />
                            }
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>DIY Guide</p>
                            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Step-by-step + savings</p>
                          </button>
                          <button
                            onClick={() => setConResult(p => ({ ...p, [idx]: 'show-zip' }))}
                            style={{ flex: 1, backgroundColor: C.goldL || '#FFF8E1', border: `1px solid ${C.gold}40`, borderRadius: 13, padding: 16, cursor: 'pointer', textAlign: 'center' }}
                          >
                            <MapPin size={22} color={C.gold} style={{ margin: '0 auto 8px', display: 'block' }} />
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>Find Pros</p>
                            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Top local contractors</p>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ZIP input */}
                    {cons === 'show-zip' && (
                      <div style={{ padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <MapPin size={18} color={C.accent} />
                          <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Find Local Contractors</p>
                        </div>
                        <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
                          {profile.zipCode ? `Using ${profile.zipCode} from your profile, or enter another:` : 'Enter your ZIP code:'}
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input
                            type="text" inputMode="numeric" maxLength={5}
                            placeholder={profile.zipCode || 'ZIP code'}
                            value={zipInputs[idx] || ''}
                            onChange={e => setZipInputs(p => ({ ...p, [idx]: e.target.value }))}
                            style={{ flex: 1, backgroundColor: C.s2, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: '10px 13px', fontSize: 14, color: C.text, fontFamily: 'inherit' }}
                          />
                          {conLoading[idx]
                            ? <div style={{ padding: 14 }}><Loader2 size={20} color={C.accent} style={{ animation: 'spin 1s linear infinite' }} /></div>
                            : <Btn label="Search" onClick={() => findPros(iss, idx)} style={{ width: 'auto', padding: '10px 18px' }} />
                          }
                        </div>
                      </div>
                    )}

                    {/* DIY result */}
                    {diy && typeof diy === 'object' && (
                      <div style={{ padding: 18 }}>
                        {/* Stats row */}
                        <div style={{ backgroundColor: C.s2, borderRadius: 13, padding: 14, display: 'flex', marginBottom: 16 }}>
                          {[['DIFFICULTY', SCR_LABEL[diy.diyScore], scColor(diy.diyScore)], ['SAVINGS', fmt(diy.savings || 0), C.green], ['TIME', diy.timeEstimate, C.text]].map(([l, v, c], i) => (
                            <div key={l} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? `1px solid ${C.border}` : 'none', padding: '0 8px' }}>
                              <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: '0.1em', marginBottom: 5 }}>{l}</p>
                              <p style={{ fontSize: 12, fontWeight: 800, color: c }}>{v}</p>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: 14, color: C.text2, marginBottom: 16, lineHeight: 1.6 }}>{diy.recommendation}</p>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                          {[['TOOLS', diy.tools], ['MATERIALS', diy.materials]].map(([label, items]) => (
                            <div key={label} style={{ flex: 1, backgroundColor: C.s2, borderRadius: 12, padding: 13 }}>
                              <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
                              {items?.map((t, i) => <p key={i} style={{ fontSize: 12, color: C.text2, marginBottom: 3 }}>• {t}</p>)}
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', marginBottom: 12 }}>STEP-BY-STEP</p>
                        {diy.steps?.map((step, i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 13, alignItems: 'flex-start' }}>
                            <div style={{ width: 25, height: 25, borderRadius: '50%', backgroundColor: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ color: C.white, fontSize: 11, fontWeight: 800 }}>{step.step}</span>
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{step.title}</p>
                              <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>{step.detail}</p>
                            </div>
                          </div>
                        ))}
                        {diy.warnings?.length > 0 && (
                          <div style={{ backgroundColor: C.yellowL, borderRadius: 11, padding: 13, marginTop: 4, border: `1px solid ${C.yellow}40` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                              <AlertTriangle size={14} color={C.yellow} />
                              <p style={{ fontSize: 10, fontWeight: 800, color: C.yellow, letterSpacing: '0.08em' }}>SAFETY WARNINGS</p>
                            </div>
                            {diy.warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: C.text2, marginBottom: 3 }}>• {w}</p>)}
                          </div>
                        )}
                        <div style={{ marginTop: 14 }}>
                          <Btn label={sharing[idx] ? 'Sharing…' : 'Share This Report'} icon={<Share2 size={15} />} variant="outline" onClick={() => shareReport(iss, idx)} disabled={!!sharing[idx]} />
                        </div>
                        <button onClick={() => { setDiyResult(p => { const n = { ...p }; delete n[idx]; return n; }); setConResult(p => { const n = { ...p }; delete n[idx]; return n; }); }} style={{ marginTop: 11, fontSize: 13, color: C.muted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                          Back to options
                        </button>
                      </div>
                    )}

                    {/* Contractors result */}
                    {cons && typeof cons === 'object' && cons !== 'show-zip' && cons.businesses && (
                      <div style={{ padding: 18 }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', marginBottom: 14 }}>
                          {cons.businesses?.length} CONTRACTORS NEAR {zipInputs[idx] || profile.zipCode}
                        </p>
                        {cons.businesses?.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>No results. Try a nearby ZIP.</p>}
                        {cons.businesses?.map((b, bi) => (
                          <div key={bi} style={{ marginBottom: 15, paddingBottom: 15, borderBottom: bi < cons.businesses.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                              <p style={{ fontSize: 15, fontWeight: 700, color: C.text, flex: 1, marginRight: 10 }}>{b.name}</p>
                              <span style={{ backgroundColor: b.isOpen ? C.greenL : C.redL, color: b.isOpen ? C.green : C.red, borderRadius: 7, padding: '3px 8px', fontSize: 10, fontWeight: 700 }}>
                                {b.isOpen ? 'OPEN' : 'CLOSED'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                              <span style={{ color: C.gold, fontSize: 13 }}>{STARS(b.rating)}</span>
                              <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>{b.rating}</span>
                              <span style={{ fontSize: 12, color: C.muted }}>{b.reviewCount} reviews</span>
                              {b.distance && <span style={{ fontSize: 12, color: C.muted }}>· {b.distance}</span>}
                            </div>
                            {b.address && <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{b.address}</p>}
                            <div style={{ display: 'flex', gap: 10 }}>
                              {b.phone && (
                                <a href={`tel:${b.phone.replace(/\D/g, '')}`} style={{
                                  backgroundColor: C.accent, color: C.white, borderRadius: 9,
                                  padding: '8px 14px', fontSize: 13, fontWeight: 700,
                                  display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                                }}>
                                  <Phone size={14} /> Call Now
                                </a>
                              )}
                              {b.url && (
                                <a href={b.url} target="_blank" rel="noreferrer" style={{
                                  backgroundColor: C.s2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 9,
                                  padding: '8px 14px', fontSize: 13, fontWeight: 600,
                                  display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                                }}>
                                  <ExternalLink size={13} /> Yelp
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                        <Btn label={sharing[idx] ? 'Sharing…' : 'Share Report'} icon={<Share2 size={15} />} variant="outline" onClick={() => shareReport(iss, idx)} disabled={!!sharing[idx]} />
                        <button onClick={() => setConResult(p => { const n = { ...p }; delete n[idx]; return n; })} style={{ marginTop: 11, fontSize: 13, color: C.muted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                          Back to options
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {result.issues?.length > 0 && (
            <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.6 }}>
              Estimates based on US national averages. Always get 2–3 quotes before committing.
            </p>
          )}
        </>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
