import React, { useState, useEffect, useRef } from 'react';
import { Camera, TrendingUp, Bookmark, BookmarkCheck, Calculator, Loader2, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { C, fmt } from '../constants/colors';
import { BACKEND, FREE_LIMIT } from '../constants/data';
import { Card, Btn, SecBtn, SL, HR } from '../components/shared';
import { getPersonalizedSuggestions, getRoiColor, resizeImageToBase64 } from '../utils/helpers';

export default function ValuePage({ profile, safetyAnswers, onNavigateCosts, checkUsage, aiUsage, isPro, onShowPaywall }) {
  const [roomImg,     setRoomImg]     = useState(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomResult,  setRoomResult]  = useState(null);
  const [roomErr,     setRoomErr]     = useState(null);
  const [filter,      setFilter]      = useState('all');
  const [expanded,    setExpanded]    = useState(null);
  const [planned,     setPlanned]     = useState({});

  const camRef = useRef();
  const libRef = useRef();

  useEffect(() => {
    try { const v = localStorage.getItem('valuePlanned'); if (v) setPlanned(JSON.parse(v)); } catch (_) {}
  }, []);

  const togglePlanned = (project) => {
    const updated = { ...planned };
    if (updated[project]) delete updated[project]; else updated[project] = true;
    setPlanned(updated);
    try { localStorage.setItem('valuePlanned', JSON.stringify(updated)); } catch (_) {}
  };

  const handleFile = async (file) => {
    if (!file) return;
    setRoomResult(null); setRoomErr(null);
    const b64 = await resizeImageToBase64(file, 1400);
    setRoomImg({ url: URL.createObjectURL(file), b64 });
  };

  const analyzeRoom = async () => {
    if (!roomImg?.b64) return;
    if (checkUsage) { const ok = await checkUsage(); if (!ok) return; }
    setRoomLoading(true); setRoomResult(null); setRoomErr(null);
    const homeCtx = profile.yearBuilt ? `Home: ${profile.homeType}, built ${profile.yearBuilt}, ${profile.sqft} sqft.` : '';
    try {
      const res = await fetch(`${BACKEND}/analyze-value`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: roomImg.b64, mediaType: 'image/jpeg', homeContext: homeCtx }),
        signal: AbortSignal.timeout(35000),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setRoomResult(await res.json());
    } catch (e) { setRoomErr(e.message); }
    finally { setRoomLoading(false); }
  };

  const personalized = getPersonalizedSuggestions(profile, safetyAnswers);
  const filtered = filter === 'quick' ? personalized.filter(s => s.quick) : filter === 'big' ? personalized.filter(s => !s.quick) : personalized;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>Increase Value</h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
            {profile.yearBuilt ? `Smart upgrades for your ${profile.yearBuilt} ${profile.homeType?.toLowerCase()}` : 'Smart upgrades ranked by return on investment'}
          </p>
        </div>
        {!isPro && (
          <button onClick={onShowPaywall} style={{
            backgroundColor: aiUsage >= FREE_LIMIT ? C.redL : C.accentL,
            border: `1px solid ${aiUsage >= FREE_LIMIT ? C.red + '50' : C.accent + '50'}`,
            borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: aiUsage >= FREE_LIMIT ? C.red : C.accent }}>{aiUsage}/{FREE_LIMIT} free</span>
          </button>
        )}
      </div>

      {/* Hidden inputs */}
      <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      <input ref={libRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

      {/* Room scanner */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, backgroundColor: C.accentL, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Camera size={22} color={C.accent} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 2 }}>Scan a Room</p>
            <p style={{ fontSize: 12, color: C.muted }}>AI analyzes your space for specific value improvements</p>
          </div>
        </div>

        {!roomImg && !roomResult && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn label="Take Photo" icon={<Camera size={15} />} onClick={() => camRef.current.click()} style={{ flex: 1 }} />
            <Btn label="Upload Photo" icon={<Camera size={15} />} variant="outline" onClick={() => libRef.current.click()} style={{ flex: 1 }} />
          </div>
        )}

        {roomImg && !roomResult && (
          <>
            <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12, height: 180, position: 'relative' }}>
              <img src={roomImg.url} alt="room" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button onClick={() => { setRoomImg(null); setRoomResult(null); }} style={{
                position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                color: C.white, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
            {!roomLoading && <Btn label="Analyze for Value Improvements" icon={<TrendingUp size={15} />} onClick={analyzeRoom} />}
          </>
        )}

        {roomLoading && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Loader2 size={32} color={C.accent} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Analyzing your space…</p>
            <p style={{ fontSize: 12, color: C.muted }}>Looking for value-adding improvements specific to this room</p>
          </div>
        )}

        {!!roomErr && (
          <div style={{ backgroundColor: C.redL, borderRadius: 10, padding: 12, border: `1px solid ${C.red}30` }}>
            <p style={{ color: C.red, fontSize: 13 }}>⚠️ {roomErr}</p>
          </div>
        )}

        {roomResult && !roomLoading && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Sparkles size={16} color={C.accent} />
              <p style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>AI Room Analysis</p>
            </div>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 14, lineHeight: 1.6 }}>{roomResult.summary}</p>
            {roomResult.improvements?.map((imp, i) => {
              const rc = getRoiColor(imp.estimatedRoi);
              return (
                <div key={i} style={{ backgroundColor: C.s2, borderRadius: 13, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1, marginRight: 10 }}>{imp.improvement}</p>
                    <span style={{ backgroundColor: rc + '18', color: rc, border: `1px solid ${rc}30`, borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {imp.estimatedRoi}% ROI
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, marginBottom: 10 }}>{imp.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>Est. cost: {fmt(imp.costLow)} – {fmt(imp.costHigh)}</span>
                    <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>+{fmt(imp.valueAdded)} value</span>
                  </div>
                  <button onClick={() => onNavigateCosts('check')} style={{
                    backgroundColor: C.accentL, border: `1px solid ${C.accent}28`, borderRadius: 9,
                    padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.accent,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    💰 Check a quote →
                  </button>
                </div>
              );
            })}
            <button onClick={() => { setRoomImg(null); setRoomResult(null); }} style={{ marginTop: 8, fontSize: 13, color: C.muted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
              Scan another room
            </button>
          </div>
        )}
      </Card>

      {/* Top Upgrades */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SL text="Top Upgrades by ROI" style={{ marginBottom: 0 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['quick', 'Quick Wins'], ['big', 'Major']].map(([key, lbl]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              backgroundColor: filter === key ? C.accent : C.s2,
              color: filter === key ? C.white : C.muted,
              border: `1px solid ${filter === key ? C.accent : C.border}`,
              borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Profile banner */}
      {!profile.yearBuilt ? (
        <div style={{ backgroundColor: C.yellowL, borderRadius: 13, padding: 14, border: `1px solid ${C.yellow}40`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertCircle size={20} color={C.yellow} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Add your home details for better suggestions</p>
            <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>Year built, home type, and ZIP code let us personalize these recommendations for your specific property.</p>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: C.accentL, borderRadius: 12, padding: 13, border: `1px solid ${C.accent}28` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>✓</span>
            <p style={{ fontSize: 12, color: C.accent, fontWeight: 600, lineHeight: 1.5 }}>
              Personalized for your {profile.yearBuilt} {profile.homeType?.toLowerCase()}{profile.zipCode ? ` in ${profile.zipCode}` : ''}.
              {Object.keys(safetyAnswers || {}).length > 0 ? ' HomeDNA scan also factored in.' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Empty filter state */}
      {filtered.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 6 }}>
            No {filter === 'quick' ? 'quick win' : 'major'} projects
          </p>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
            {filter === 'quick' ? 'No quick wins match your home profile.' : 'No major projects match your home profile.'} Try "All".
          </p>
          <button onClick={() => setFilter('all')} style={{ marginTop: 14, fontSize: 13, color: C.accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Show all projects</button>
        </Card>
      )}

      {filtered.map((s, i) => {
        const isExp = expanded === i;
        const roiColor = getRoiColor(s.roi);
        const isPlanned = !!planned[s.project];
        return (
          <Card key={i} style={{ padding: 0, overflow: 'hidden' }}>
            <button onClick={() => setExpanded(isExp ? null : i)} style={{ width: '100%', padding: 16, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, backgroundColor: roiColor + '18', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={20} color={roiColor} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>{s.project}</p>
                    {isPlanned && <span style={{ backgroundColor: C.greenL, color: C.green, border: `1px solid ${C.green}30`, borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 800 }}>PLANNED</span>}
                    {s.quick && !isPlanned && <span style={{ backgroundColor: C.greenL, color: C.green, border: `1px solid ${C.green}30`, borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 800 }}>QUICK WIN</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: roiColor }}>{s.roi}% ROI</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{fmt(s.cost[0])} – {fmt(s.cost[1])}</span>
                  </div>
                </div>
                <div style={{ color: C.muted }}>{isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
              </div>
            </button>

            {isExp && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: 16 }}>
                <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 16 }}>{s.why}</p>

                <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', marginBottom: 8 }}>RETURN ON INVESTMENT</p>
                <div style={{ height: 8, backgroundColor: C.border, borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
                  <div style={{ height: 8, width: `${Math.min(s.roi, 100)}%`, backgroundColor: roiColor, borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>0%</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: roiColor }}>{s.roi}%</span>
                  <span style={{ fontSize: 12, color: C.muted }}>100%+</span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  {[['EST. COST', `${fmt(s.cost[0])} – ${fmt(s.cost[1])}`, C.text], ['VALUE ADDED', `${fmt(Math.round(s.cost[0] * s.roi / 100))} – ${fmt(Math.round(s.cost[1] * s.roi / 100))}`, C.green]].map(([l, v, c]) => (
                    <div key={l} style={{ flex: 1, backgroundColor: C.s2, borderRadius: 11, padding: 12, textAlign: 'center' }}>
                      <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', marginBottom: 5 }}>{l}</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: c }}>{v}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => togglePlanned(s.project)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: 12, borderRadius: 11, cursor: 'pointer',
                    backgroundColor: isPlanned ? C.greenL : C.s2,
                    border: `1px solid ${isPlanned ? C.green + '40' : C.border}`,
                    fontSize: 13, fontWeight: 700, color: isPlanned ? C.green : C.muted,
                  }}>
                    {isPlanned ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    {isPlanned ? 'Planned' : 'Plan this'}
                  </button>
                  <button onClick={() => { setExpanded(null); onNavigateCosts('roi'); }} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: 12, borderRadius: 11, cursor: 'pointer',
                    backgroundColor: C.accentL, border: `1px solid ${C.accent}28`,
                    fontSize: 13, fontWeight: 700, color: C.accent,
                  }}>
                    <Calculator size={15} /> ROI Calc
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.6 }}>
        ROI figures from the 2024 Cost vs. Value Report. Results vary by location, materials, and market conditions.
      </p>
      <div style={{ height: 24 }} />
    </div>
  );
}
