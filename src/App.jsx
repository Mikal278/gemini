import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { C } from './constants/colors';
import { DEFAULT_PROFILE, FREE_LIMIT, PRO_LIMIT, AWARDS } from './constants/data';
import { calcSafetyScore } from './components/shared';
import AuthModal from './components/AuthModal';
import Layout from './components/Layout';
import MyHomePage from './screens/MyHomePage';
import SettingsPage from './screens/SettingsPage';
import InspectPage from './screens/InspectPage';
import ValuePage from './screens/ValuePage';
import CostsPage from './screens/CostsPage';

export default function App() {
  const [user,              setUser]              = useState(null);
  const [authLoading,       setAuthLoading]       = useState(true);
  const [activeTab,         setActiveTab]         = useState('home');
  const [showAuthModal,     setShowAuthModal]     = useState(false);

  const [properties,        setProperties]        = useState([]);
  const [activePropertyIdx, setActivePropertyIdx] = useState(0);
  const [safetyAnswers,     setSafetyAnswers]     = useState({});
  const [repairLog,         setRepairLog]         = useState([]);
  const [aiUsage,           setAiUsage]           = useState(0);
  const [proStatus,         setProStatus]         = useState({ isPro: false, expiresAt: null });
  const [syncing,           setSyncing]           = useState(false);
  const [awards,            setAwards]            = useState({});
  const [points,            setPoints]            = useState(0);

  const profile = properties[activePropertyIdx] || { ...DEFAULT_PROFILE };
  const isPro   = proStatus.isPro && (!proStatus.expiresAt || new Date(proStatus.expiresAt) > new Date());
  const score   = calcSafetyScore(profile.id ? safetyAnswers[profile.id] || {} : {});

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) loadUserData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowAuthModal(false);
        loadUserData(session.user.id);
      }
    });

    try {
      const a = localStorage.getItem('zaydAwards');
      const p = localStorage.getItem('zaydPoints');
      if (a) setAwards(JSON.parse(a));
      if (p) setPoints(parseInt(p) || 0);
    } catch (_) {}

    return () => subscription.unsubscribe();
  }, []);

  // ── Load all user data ───────────────────────────────────────────────────
  const loadUserData = async (uid) => {
    setSyncing(true);
    try {
      const month = new Date().toISOString().slice(0, 7);
      const [propsRes, safetyRes, repairsRes, usageRes, profileRes] = await Promise.all([
        supabase.from('properties').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
        supabase.from('safety_answers').select('answers').eq('user_id', uid).single(),
        supabase.from('repair_log').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('ai_usage').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('month', month),
        supabase.from('profiles').select('is_pro, pro_expires_at').eq('id', uid).single(),
      ]);

      let loadedProps = [];
      if (propsRes.data?.length > 0) {
        loadedProps = propsRes.data.map(p => ({
          id: p.id, name: p.name || '', yearBuilt: p.year_built || '',
          homeType: p.home_type || 'Single Family', sqft: p.sqft || '', zipCode: p.zip_code || '',
        }));
        setProperties(loadedProps);
      }

      if (safetyRes.data?.answers) {
        const loaded = safetyRes.data.answers;
        const firstVal = Object.values(loaded)[0];
        if (typeof firstVal === 'number' && loadedProps.length > 0) {
          setSafetyAnswers({ [loadedProps[0].id]: loaded });
        } else {
          setSafetyAnswers(loaded);
        }
      }

      if (repairsRes.data) {
        setRepairLog(repairsRes.data.map(r => ({
          id: r.id, propertyId: r.property_id || null,
          name: r.name, cost: parseFloat(r.cost),
          date: r.date, notes: r.notes || '',
          type: r.type || 'Expense', category: r.category || '',
          contractor: r.contractor || '', property: r.property || '',
          unit: r.unit || '', warranty: r.warranty || '',
          taxDeductible: r.tax_deductible || false,
        })));
      }

      setAiUsage(usageRes.count || 0);
      if (profileRes.data) {
        setProStatus({ isPro: !!profileRes.data.is_pro, expiresAt: profileRes.data.pro_expires_at || null });
      }
    } catch (e) {
      console.error('Load error:', e.message);
    } finally {
      setSyncing(false);
    }
  };

  // ── Add property ─────────────────────────────────────────────────────────
  const addProperty = async (prop) => {
    const newIdx = properties.length;
    if (user) {
      const tempProp = { ...prop, id: 'temp-' + Date.now() };
      setProperties(p => [...p, tempProp]);
      setActivePropertyIdx(newIdx);
      const { data, error } = await supabase.from('properties').insert({
        user_id: user.id, name: prop.name, year_built: prop.yearBuilt,
        home_type: prop.homeType, sqft: prop.sqft, zip_code: prop.zipCode,
      }).select().single();
      if (error) { setProperties(p => p.filter(x => x.id !== tempProp.id)); return; }
      if (data) {
        const saved = { id: data.id, name: data.name || '', yearBuilt: data.year_built || '', homeType: data.home_type || 'Single Family', sqft: data.sqft || '', zipCode: data.zip_code || '' };
        setProperties(p => p.map(x => x.id === tempProp.id ? saved : x));
      }
    } else {
      setProperties(p => [...p, { ...prop, id: Date.now() }]);
      setActivePropertyIdx(newIdx);
    }
  };

  // ── Update property ───────────────────────────────────────────────────────
  const updateProperty = async (idx, prop) => {
    const current = properties[idx];
    setProperties(p => { const u = [...p]; u[idx] = { ...u[idx], ...prop }; return u; });
    if (!user || !current?.id) return;
    await supabase.from('properties').update({
      name: prop.name, year_built: prop.yearBuilt, home_type: prop.homeType,
      sqft: prop.sqft, zip_code: prop.zipCode,
    }).eq('id', current.id);
  };

  // ── Save safety answers ───────────────────────────────────────────────────
  const saveSafetyAnswers = async (answers) => {
    const propertyId = profile.id;
    const updated = propertyId ? { ...safetyAnswers, [propertyId]: answers } : safetyAnswers;
    setSafetyAnswers(updated);
    if (!user) return;
    const existing = await supabase.from('safety_answers').select('id').eq('user_id', user.id).single();
    if (existing.data) {
      await supabase.from('safety_answers').update({ answers: updated, updated_at: new Date().toISOString() }).eq('user_id', user.id);
    } else {
      await supabase.from('safety_answers').insert({ user_id: user.id, answers: updated });
    }
  };

  // ── Add repair ────────────────────────────────────────────────────────────
  const addRepair = async (repair) => {
    if (user) {
      const propertyId = profile.id && !String(profile.id).startsWith('temp-') ? profile.id : null;
      const { data, error } = await supabase.from('repair_log').insert({
        user_id: user.id, property_id: propertyId,
        name: repair.name, cost: repair.cost, date: repair.date,
        notes: repair.notes || '', type: repair.type || 'Expense',
        category: repair.category || '', contractor: repair.contractor || '',
        property: repair.property || '', unit: repair.unit || '',
        warranty: repair.warranty || '', tax_deductible: repair.taxDeductible || false,
      }).select().single();
      if (error) return;
      if (data) {
        setRepairLog(r => [{
          id: data.id, propertyId: data.property_id || null,
          name: data.name, cost: parseFloat(data.cost), date: data.date,
          notes: data.notes || '', type: data.type || 'Expense',
          category: data.category || '', contractor: data.contractor || '',
          property: data.property || '', unit: data.unit || '',
          warranty: data.warranty || '', taxDeductible: data.tax_deductible || false,
        }, ...r]);
      }
    } else {
      setRepairLog(r => [{ ...repair, id: Date.now(), propertyId: profile.id || null }, ...r]);
    }
  };

  // ── Remove repair ─────────────────────────────────────────────────────────
  const removeRepair = async (id) => {
    setRepairLog(r => r.filter(x => x.id !== id));
    if (user) await supabase.from('repair_log').delete().eq('id', id);
  };

  // ── AI usage gate ─────────────────────────────────────────────────────────
  const checkAndIncrementUsage = async () => {
    const month = new Date().toISOString().slice(0, 7);
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
    if (user) {
      const { count, error } = await supabase.from('ai_usage').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('month', month);
      const serverCount = error ? aiUsage : (count || 0);
      setAiUsage(serverCount);
      if (serverCount >= limit) return false;
      await supabase.from('ai_usage').insert({ user_id: user.id, month });
      setAiUsage(serverCount + 1);
      return true;
    } else {
      if (aiUsage >= FREE_LIMIT) { setShowAuthModal(true); return false; }
      setAiUsage(c => c + 1);
      return true;
    }
  };

  // ── Grant award ───────────────────────────────────────────────────────────
  const grantAward = (id) => {
    const award = AWARDS.find(a => a.id === id);
    if (!award) return;
    setAwards(prev => {
      if (prev[id]) return prev;
      const updated = { ...prev, [id]: Date.now() };
      localStorage.setItem('zaydAwards', JSON.stringify(updated));
      setPoints(p => {
        const newPts = p + award.pts;
        localStorage.setItem('zaydPoints', String(newPts));
        return newPts;
      });
      return updated;
    });
  };

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProperties([]); setActivePropertyIdx(0);
    setSafetyAnswers({}); setRepairLog([]); setAiUsage(0);
    setProStatus({ isPro: false, expiresAt: null });
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: C.accent, flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: 48 }}>🏠</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: 0.5 }}>Zayd</span>
        <div style={{ width: 32, height: 32, border: `3px solid ${C.accentL}44`, borderTop: `3px solid ${C.accentL}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user}>
        {syncing && (
          <div style={{ backgroundColor: C.accent, padding: '6px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: C.accentL, fontWeight: 600 }}>Syncing…</span>
          </div>
        )}

        {activeTab === 'home' && (
          <MyHomePage
            user={user}
            profile={profile}
            properties={properties}
            addProperty={addProperty}
            updateProperty={updateProperty}
            activePropertyIdx={activePropertyIdx}
            setActivePropertyIdx={setActivePropertyIdx}
            safetyAnswers={safetyAnswers}
            saveSafetyAnswers={saveSafetyAnswers}
            score={score}
            repairLog={repairLog}
            addRepair={addRepair}
            removeRepair={removeRepair}
            grantAward={grantAward}
            awards={awards}
            points={points}
            onShowAuth={() => setShowAuthModal(true)}
          />
        )}

        {activeTab === 'inspect' && (
          <InspectPage
            profile={profile}
            checkUsage={checkAndIncrementUsage}
            aiUsage={aiUsage}
            isPro={isPro}
            onShowPaywall={() => {}}
            onNavigateCosts={() => setActiveTab('costs')}
          />
        )}

        {activeTab === 'value' && (
          <ValuePage
            profile={profile}
            safetyAnswers={profile?.id ? safetyAnswers[profile.id] || {} : {}}
            onNavigateCosts={() => setActiveTab('costs')}
            checkUsage={checkAndIncrementUsage}
            aiUsage={aiUsage}
            isPro={isPro}
            onShowPaywall={() => {}}
          />
        )}

        {activeTab === 'costs' && (
          <CostsPage
            profile={profile}
            repairLog={repairLog}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            user={user}
            onSignOut={signOut}
            onShowAuth={() => setShowAuthModal(true)}
            isPro={isPro}
          />
        )}
      </Layout>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
