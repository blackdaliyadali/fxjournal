import { useState } from 'react';
import { useStore } from './store.jsx';
import { Plus, Trash2 } from 'lucide-react';

const TYPES = ['funded','challenge','evaluation'];
const PLATFORMS = ['MT5','MT4','eTrader','cTrader','DXtrade'];
const FIRMS = ['FTMO','E8 Funding','MyForexFunds','Funded Next','The5ers','True Forex Funds','Topstep','Apex'];

export default function Accounts() {
  const { accounts, trades, addAccount, deleteAccount } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', firm:'FTMO', type:'challenge', platform:'MT5', size:10000, riskPct:1, dailyLimit:5, maxDD:10, target:10 });

  function save() {
    if (!form.name.trim() || !form.firm) return;
    addAccount({ ...form, size: Number(form.size), riskPct: Number(form.riskPct), dailyLimit: Number(form.dailyLimit), maxDD: Number(form.maxDD), target: Number(form.target) });
    setForm({ name:'', firm:'FTMO', type:'challenge', platform:'MT5', size:10000, riskPct:1, dailyLimit:5, maxDD:10, target:10 });
    setShowForm(false);
  }

  const typeBadge = { funded:'badge-funded', challenge:'badge-challenge', evaluation:'badge-eval' };

  return (
    <div className="fade-in" style={{ padding:24, maxWidth:1000, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ fontSize:18, fontWeight:600 }}>Prop firm accounts</h2>
        <button className="btn-primary" onClick={()=>setShowForm(v=>!v)}><Plus size={15}/>Add account</button>
      </div>

      {showForm && (
        <div className="card fade-in">
          <div className="section-title">New account</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label className="label">Account name</label>
              <input className="input-field" placeholder="e.g. FTMO #1" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Firm</label>
              <select className="input-field" value={form.firm} onChange={e=>setForm(f=>({...f,firm:e.target.value}))} style={{ background:'var(--bg-2)', color:'var(--text-1)' }}>
                {FIRMS.map(x=><option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{ background:'var(--bg-2)', color:'var(--text-1)' }}>
                {TYPES.map(x=><option key={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:12, marginBottom:14 }}>
            {[
              { lbl:'Platform', key:'platform', type:'select', opts:PLATFORMS },
              { lbl:'Account size ($)', key:'size', type:'number', placeholder:'100000' },
              { lbl:'Risk per trade (%)', key:'riskPct', type:'number', placeholder:'1' },
              { lbl:'Daily loss limit (%)', key:'dailyLimit', type:'number', placeholder:'5' },
              { lbl:'Max drawdown (%)', key:'maxDD', type:'number', placeholder:'10' },
            ].map(({lbl,key,type,opts,placeholder})=>(
              <div key={key}>
                <label className="label">{lbl}</label>
                {type==='select'
                  ? <select className="input-field" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{ background:'var(--bg-2)', color:'var(--text-1)' }}>{opts.map(o=><option key={o}>{o}</option>)}</select>
                  : <input type="number" className="input-field" placeholder={placeholder} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>
                }
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-primary" onClick={save}>Save account</button>
            <button className="btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {accounts.map(a => {
          const acT = trades.filter(t=>t.accountId===a.id);
          const pnl = acT.reduce((s,t)=>s+t.result,0);
          const wins = acT.filter(t=>t.result>0).length;
          const wr = acT.length ? Math.round(wins/acT.length*100) : 0;
          const riskPerTrade = (a.size * a.riskPct / 100);
          return (
            <div key={a.id} className="card">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:600 }}>{a.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>{a.firm} · {a.platform}</div>
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span className={`badge ${typeBadge[a.type]}`}>{a.type}</span>
                  <button onClick={()=>deleteAccount(a.id)} className="btn-ghost" style={{ padding:'3px 7px', color:'var(--red)' }}><Trash2 size={12}/></button>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
                {[
                  { lbl:'Account size', val:'$'+a.size.toLocaleString() },
                  { lbl:'Risk/trade', val:`${a.riskPct}% ($${riskPerTrade.toLocaleString()})` },
                  { lbl:'Net P&L', val:(pnl>=0?'+':'')+pnl.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0}), col: pnl>=0?'var(--accent)':'var(--red)' },
                  { lbl:'Daily limit', val:`${a.dailyLimit}%` },
                  { lbl:'Max drawdown', val:`${a.maxDD}%` },
                  { lbl:'Profit target', val:`${a.target}%` },
                ].map(({lbl,val,col})=>(
                  <div key={lbl} style={{ background:'var(--bg-2)', borderRadius:'var(--radius-sm)', padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:3 }}>{lbl}</div>
                    <div style={{ fontSize:13, fontWeight:600, fontFamily:'JetBrains Mono,monospace', color:col||'var(--text-1)' }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:16, fontSize:11, color:'var(--text-2)', paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <span>Win rate: <strong style={{ color: wr>=60?'var(--accent)':wr>=45?'var(--amber)':'var(--red)' }}>{wr}%</strong></span>
                <span>Total trades: <strong style={{ color:'var(--text-1)' }}>{acT.length}</strong></span>
                <span>Wins: <strong style={{ color:'var(--accent)' }}>{wins}</strong></span>
                <span>Losses: <strong style={{ color:'var(--red)' }}>{acT.length-wins}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
