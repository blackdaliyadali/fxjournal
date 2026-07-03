import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase.js';

const Ctx = createContext(null);

const SYSTEMS_DEFAULT = [
  { id: 'tb', name: 'Tokyo Breakout', color: '#58A6FF', pairs: ['USDJPY','GBPUSD','EURUSD'] },
  { id: 'ts', name: 'Tokyo Scalp',    color: '#BC8CFF', pairs: ['XAUUSD','USDJPY','GBPJPY'] },
];
const ACCOUNTS_DEFAULT = [
  { id: 'a1', name: 'FTMO #1',    firm: 'FTMO',         type: 'funded',    platform: 'MT5',     size: 100000, riskPct: 1,    dailyLimit: 5, maxDD: 10, target: 10 },
  { id: 'a2', name: 'E8 Phase 1', firm: 'E8 Funding',   type: 'challenge', platform: 'eTrader', size: 50000,  riskPct: 0.5,  dailyLimit: 5, maxDD: 8,  target: 8  },
  { id: 'a3', name: 'MyFF P2',    firm: 'MyForexFunds', type: 'evaluation',platform: 'MT5',     size: 25000,  riskPct: 0.75, dailyLimit: 5, maxDD: 10, target: 5  },
];

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export function StoreProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [accounts,  setAccounts]  = useState([]);
  const [systems,   setSystems]   = useState([]);
  const [trades,    setTrades]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [theme,     setTheme]     = useState(() => loadLS('fxj_theme', 'dark'));
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data when user logs in
  useEffect(() => {
    if (user) loadAll();
    else { setAccounts([]); setSystems([]); setTrades([]); }
  }, [user]);

  // Theme
  useEffect(() => {
    localStorage.setItem('fxj_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  async function loadAll() {
    setLoading(true);
    const uid = user.id;
    const [accRes, sysRes, trRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('systems').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('trades').select('*').eq('user_id', uid).order('date', { ascending: false }),
    ]);
    // Seed defaults for new users
    const accs = accRes.data?.length ? accRes.data : await seedAccounts(uid);
    const syss = sysRes.data?.length ? sysRes.data : await seedSystems(uid);
    setAccounts(accs || []);
    setSystems(syss || []);
    setTrades(trRes.data || []);
    setLoading(false);
  }

  async function seedAccounts(uid) {
    const rows = ACCOUNTS_DEFAULT.map(a => ({ ...a, user_id: uid, id: undefined }));
    const { data } = await supabase.from('accounts').insert(rows).select();
    return data;
  }
  async function seedSystems(uid) {
    const rows = SYSTEMS_DEFAULT.map(s => ({ ...s, user_id: uid, id: undefined }));
    const { data } = await supabase.from('systems').insert(rows).select();
    return data;
  }

  // ── TRADES ──
  async function addTrade(t) {
    const { data, error } = await supabase.from('trades').insert({ ...t, user_id: user.id }).select().single();
    if (!error && data) setTrades(p => [data, ...p]);
  }
  async function updateTrade(t) {
    const { data, error } = await supabase.from('trades').update(t).eq('id', t.id).select().single();
    if (!error && data) setTrades(p => p.map(x => x.id===t.id ? data : x));
  }
  async function deleteTrade(id) {
    await supabase.from('trades').delete().eq('id', id);
    setTrades(p => p.filter(x => x.id !== id));
  }

  // ── ACCOUNTS ──
  async function addAccount(a) {
    const { data, error } = await supabase.from('accounts').insert({ ...a, user_id: user.id }).select().single();
    if (!error && data) setAccounts(p => [...p, data]);
  }
  async function deleteAccount(id) {
    await supabase.from('accounts').delete().eq('id', id);
    setAccounts(p => p.filter(x => x.id !== id));
  }

  // ── SYSTEMS ──
  async function addSystem(s) {
    const { data, error } = await supabase.from('systems').insert({ ...s, user_id: user.id }).select().single();
    if (!error && data) setSystems(p => [...p, data]);
  }
  async function deleteSystem(id) {
    await supabase.from('systems').delete().eq('id', id);
    setSystems(p => p.filter(x => x.id !== id));
  }

  async function signOut() { await supabase.auth.signOut(); }
  function toggleTheme() { setTheme(t => t==='dark'?'light':'dark'); }

  return (
    <Ctx.Provider value={{ user, authReady, accounts, systems, trades, loading, theme, activeTab,
      setActiveTab, addTrade, updateTrade, deleteTrade, addAccount, deleteAccount,
      addSystem, deleteSystem, toggleTheme, signOut, loadAll }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
