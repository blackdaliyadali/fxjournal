import { useState, useCallback } from 'react';
import { useStore } from './store.jsx';
import { Plus, Trash2, Copy, Save, FolderOpen, Download, RefreshCw, Check } from 'lucide-react';

const PAIRS = [
  { value: 'XAGUSD', label: 'XAGUSD (Silver)', type: 'commodity', contractSize: 5000 },
  { value: 'XAUUSD', label: 'XAUUSD (Gold)',   type: 'commodity', contractSize: 100  },
  { value: 'BTCUSD', label: 'BTCUSD (Bitcoin)',type: 'crypto',    contractSize: 1    },
  { value: 'EURUSD', label: 'EURUSD',           type: 'forex',     contractSize: null },
  { value: 'GBPUSD', label: 'GBPUSD',           type: 'forex',     contractSize: null },
  { value: 'USDJPY', label: 'USDJPY',           type: 'forex',     contractSize: null },
  { value: 'GBPJPY', label: 'GBPJPY',           type: 'forex',     contractSize: null },
  { value: 'AUDNZD', label: 'AUDNZD',           type: 'forex',     contractSize: null },
  { value: 'USDCHF', label: 'USDCHF',           type: 'forex',     contractSize: null },
  { value: 'AUDUSD', label: 'AUDUSD',           type: 'forex',     contractSize: null },
  { value: 'EURJPY', label: 'EURJPY',           type: 'forex',     contractSize: null },
  { value: 'USDCAD', label: 'USDCAD',           type: 'forex',     contractSize: null },
];

function calcLots(pair, riskAmt, slPips, contractSize) {
  if (!riskAmt || !slPips || riskAmt <= 0 || slPips <= 0) return 0;
  const p = PAIRS.find(x => x.value === pair);
  if (!p) return 0;
  if (p.type === 'commodity') {
    const cs = contractSize || p.contractSize || 5000;
    return Math.round((riskAmt / slPips) / cs * 100) / 100;
  }
  if (p.type === 'crypto') {
    return Math.round((riskAmt / slPips) * 100) / 100;
  }
  // forex: pip value = $10 per standard lot
  return Math.round((riskAmt / (slPips * 10)) * 100) / 100;
}

function AccountSizerCard({ account, pair, onRemove, copiedId, onCopy }) {
  const [risk, setRisk] = useState(account.risk || '');
  const [sl,   setSl]   = useState(account.sl   || '');
  const [contractSize, setContractSize] = useState(account.contractSize || '5000');
  const [name, setName] = useState(account.name);

  const pairObj = PAIRS.find(p => p.value === pair);
  const isCommodity = pairObj?.type === 'commodity';
  const lots = calcLots(pair, parseFloat(risk), parseFloat(sl), parseFloat(contractSize));
  const riskDollar = parseFloat(risk) || 0;

  account.lots = lots;
  account.risk = risk;
  account.sl = sl;
  account.contractSize = contractSize;
  account.name = name;

  const color = lots > 0 ? 'var(--accent)' : 'var(--text-3)';

  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:14, position:'relative', borderColor: lots>0?'rgba(0,212,168,.25)':'var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ background:'transparent', border:'none', borderBottom:'1.5px solid transparent', color:'var(--text-1)', fontSize:14, fontWeight:600, padding:'2px 0', width:'65%', outline:'none', transition:'border-color .15s' }}
          onFocus={e=>e.target.style.borderBottomColor='var(--accent)'}
          onBlur={e=>e.target.style.borderBottomColor='transparent'}
        />
        <button onClick={onRemove} className="btn-ghost" style={{ padding:'4px 8px', color:'var(--red)' }}><Trash2 size={13}/></button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <label className="label">Risk amount ($)</label>
          <input className="input-field" type="number" placeholder="e.g. 150" value={risk} onChange={e=>setRisk(e.target.value)}/>
        </div>
        <div>
          <label className="label">Stop loss (pips/pts)</label>
          <input className="input-field" type="number" placeholder="e.g. 3.754" step="0.00001" value={sl} onChange={e=>setSl(e.target.value)}/>
        </div>
      </div>

      {isCommodity && (
        <div>
          <label className="label">Contract size (oz / units)</label>
          <input className="input-field" type="number" placeholder="5000" value={contractSize} onChange={e=>setContractSize(e.target.value)}/>
        </div>
      )}

      <div style={{
        background: lots>0 ? 'var(--accent-dim)' : 'var(--bg-2)',
        border:`1.5px solid ${lots>0?'rgba(0,212,168,.4)':'var(--border)'}`,
        borderRadius:10, padding:'16px 14px', textAlign:'center',
        transition:'all .3s',
      }}>
        <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:6 }}>Recommended lot size</div>
        <div style={{ fontSize:36, fontWeight:700, fontFamily:'JetBrains Mono,monospace', color, lineHeight:1, transition:'color .3s' }}>
          {lots > 0 ? lots.toFixed(2) : '—'}
        </div>
        {lots > 0 && (
          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:6 }}>
            Risk ${riskDollar.toLocaleString()} · SL {parseFloat(sl)} {isCommodity?'pts':'pips'}
          </div>
        )}
      </div>

      <button
        className="btn-ghost"
        style={{ width:'100%', justifyContent:'center', color: copiedId===account.id?'var(--accent)':'var(--text-2)' }}
        onClick={() => onCopy(account.id, lots)}
        disabled={lots <= 0}
      >
        {copiedId===account.id ? <><Check size={14}/>Copied!</> : <><Copy size={14}/>Copy lot size</>}
      </button>
    </div>
  );
}

export default function PositionSizer() {
  const { accounts: journalAccounts } = useStore();
  const [pair,    setPair]    = useState('XAGUSD');
  const [globalSL, setGlobalSL] = useState('');
  const [toast,   setToast]   = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const [sizerAccounts, setSizerAccounts] = useState(() =>
    journalAccounts.length > 0
      ? journalAccounts.map(a => ({ id: a.id+'_s', name: a.name, risk: String(a.size * a.riskPct / 100), sl:'', contractSize:'5000', lots:0 }))
      : [{ id:'s1', name:'Account 1', risk:'', sl:'', contractSize:'5000', lots:0 }]
  );

  const pairObj = PAIRS.find(p => p.value === pair);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function addSizerAccount() {
    setSizerAccounts(prev => [...prev, { id:'s_'+Date.now(), name:`Account ${prev.length+1}`, risk:'', sl:'', contractSize:'5000', lots:0 }]);
  }

  function removeAccount(id) {
    setSizerAccounts(prev => prev.filter(a => a.id !== id));
  }

  function applyCommonSL() {
    if (!globalSL) return;
    setSizerAccounts(prev => prev.map(a => ({ ...a, sl: globalSL })));
    showToast('Common SL applied to all accounts');
  }

  function copyLot(id, lots) {
    if (lots <= 0) return;
    navigator.clipboard.writeText(lots.toFixed(2)).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Copied: ${lots.toFixed(2)} lots`);
  }

  function savePreset() {
    const data = { version:'1.0', savedAt: new Date().toISOString(), pair, globalSL, accounts: sizerAccounts };
    const blob = new Blob([JSON.stringify(data, null,2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`sizer-preset-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Preset saved to downloads');
  }

  function loadPreset(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.pair)      setPair(d.pair);
        if (d.globalSL)  setGlobalSL(d.globalSL);
        if (d.accounts)  setSizerAccounts(d.accounts.map((a,i) => ({ ...a, id:'loaded_'+i })));
        showToast(`Loaded ${d.accounts?.length||0} accounts`);
      } catch { showToast('Error loading preset'); }
    };
    reader.readAsText(file);
    e.target.value='';
  }

  function exportCSV() {
    const header = 'Account,Risk ($),SL,Lots\n';
    const rows = sizerAccounts.map(a => `"${a.name}",${a.risk||0},${a.sl||0},${a.lots||0}`).join('\n');
    const blob = new Blob([header+rows], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`position-sizing-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('CSV exported');
  }

  function clearAll() {
    if (!window.confirm('Clear all accounts?')) return;
    setSizerAccounts([]);
    showToast('Cleared');
  }

  function importFromJournal() {
    const imported = journalAccounts.map(a => ({
      id: 'imp_'+a.id, name: a.name,
      risk: String(Math.round(a.size * a.riskPct / 100)),
      sl:'', contractSize:'5000', lots:0,
    }));
    setSizerAccounts(imported);
    showToast(`Imported ${imported.length} accounts from journal`);
  }

  const totalRisk = sizerAccounts.reduce((s,a) => s + (parseFloat(a.risk)||0), 0);
  const totalLots = sizerAccounts.reduce((s,a) => s + (a.lots||0), 0);

  return (
    <div className="fade-in" style={{ padding:24, maxWidth:1300, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

      {toast && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:999,
          background:'var(--accent)', color:'#0D1117', padding:'10px 18px',
          borderRadius:10, fontWeight:600, fontSize:13,
          animation:'fadeIn .2s ease',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700 }}>Position sizer</h2>
          <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>Calculate lot sizes for all your prop accounts at once</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-ghost" onClick={importFromJournal} style={{ fontSize:12 }}>
            <RefreshCw size={13}/> Import from journal accounts
          </button>
        </div>
      </div>

      {/* Global controls */}
      <div className="card">
        <div className="section-title" style={{ marginBottom:14 }}>Global settings</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
          <div>
            <label className="label">Instrument / pair</label>
            <select className="input-field" value={pair} onChange={e=>setPair(e.target.value)} style={{ background:'var(--bg-2)', color:'var(--text-1)' }}>
              {PAIRS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Common stop loss (pips/pts)</label>
            <input className="input-field" type="number" placeholder="e.g. 3.754" step="0.00001" value={globalSL} onChange={e=>setGlobalSL(e.target.value)}/>
          </div>
          <div>
            <label className="label" style={{ opacity:0 }}>.</label>
            <button className="btn-ghost" style={{ width:'100%', justifyContent:'center' }} onClick={applyCommonSL}>
              Apply SL to all accounts
            </button>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn-ghost" title="Add account" onClick={addSizerAccount} style={{ padding:'9px 12px' }}><Plus size={15}/></button>
          </div>
        </div>

        {pairObj && (
          <div style={{ marginTop:12, padding:'8px 12px', background:'var(--bg-3)', borderRadius:8, fontSize:11, color:'var(--text-2)', display:'flex', gap:16 }}>
            <span>Type: <strong style={{ color:'var(--text-1)' }}>{pairObj.type}</strong></span>
            {pairObj.contractSize && <span>Default contract: <strong style={{ color:'var(--text-1)' }}>{pairObj.contractSize.toLocaleString()} units</strong></span>}
            <span>Formula: <strong style={{ color:'var(--text-1)' }}>{pairObj.type==='commodity'?'Risk ÷ SL ÷ Contract size':pairObj.type==='crypto'?'Risk ÷ SL':'Risk ÷ (SL × 10)'}</strong></span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button className="btn-ghost" style={{ fontSize:12 }} onClick={savePreset}><Save size={13}/> Save preset</button>
        <label className="btn-ghost" style={{ fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:'var(--radius)', border:'1px solid var(--border-strong)', color:'var(--text-2)' }}>
          <FolderOpen size={13}/> Load preset
          <input type="file" accept=".json" style={{ display:'none' }} onChange={loadPreset}/>
        </label>
        <button className="btn-ghost" style={{ fontSize:12 }} onClick={exportCSV}><Download size={13}/> Export CSV</button>
        <button className="btn-ghost" style={{ fontSize:12, color:'var(--red)' }} onClick={clearAll}><Trash2 size={13}/> Clear all</button>
        <button className="btn-ghost" style={{ fontSize:12 }} onClick={addSizerAccount}><Plus size={13}/> Add account</button>
      </div>

      {/* Account cards */}
      {sizerAccounts.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:14 }}>No accounts. Add one or import from journal.</div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button className="btn-ghost" onClick={addSizerAccount}><Plus size={14}/>Add account</button>
            <button className="btn-ghost" onClick={importFromJournal}><RefreshCw size={14}/>Import from journal</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {sizerAccounts.map(a => (
            <AccountSizerCard
              key={a.id}
              account={a}
              pair={pair}
              onRemove={() => removeAccount(a.id)}
              copiedId={copiedId}
              onCopy={copyLot}
            />
          ))}
        </div>
      )}

      {/* Summary footer */}
      {sizerAccounts.length > 0 && (
        <div style={{
          background:'var(--bg-1)', border:'1px solid rgba(0,212,168,.25)',
          borderRadius:14, padding:'16px 24px',
          display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12,
          position:'sticky', bottom:16,
        }}>
          {[
            { lbl:'Total accounts', val: sizerAccounts.length },
            { lbl:'Total risk', val: '$'+totalRisk.toLocaleString(), col: totalRisk>0?'var(--accent)':'var(--text-1)' },
            { lbl:'Total lots', val: totalLots.toFixed(2), col:'var(--text-1)' },
            { lbl:'Pair', val: pair },
          ].map(({lbl,val,col})=>(
            <div key={lbl} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.6, marginBottom:4 }}>{lbl}</div>
              <div style={{ fontSize:22, fontWeight:700, fontFamily:'JetBrains Mono,monospace', color:col||'var(--accent)' }}>{val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
