import { useState } from 'react';
import { useStore } from './store.jsx';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = ['#58A6FF','#BC8CFF','#00D4A8','#E3B341','#F85149','#FF9500'];

export default function Systems() {
  const { systems, trades, accounts, addSystem, deleteSystem } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', color: COLORS[0], pairs:'' });

  function save() {
    if (!form.name.trim()) return;
    addSystem({ name: form.name.trim(), color: form.color, pairs: form.pairs.split(',').map(p=>p.trim()).filter(Boolean) });
    setForm({ name:'', color: COLORS[0], pairs:'' });
    setShowForm(false);
  }

  return (
    <div className="fade-in" style={{ padding:24, maxWidth:1000, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ fontSize:18, fontWeight:600 }}>Trade systems</h2>
        <button className="btn-primary" onClick={()=>setShowForm(v=>!v)}><Plus size={15}/>Add system</button>
      </div>

      {showForm && (
        <div className="card fade-in">
          <div className="section-title">New system</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label className="label">System name</label>
              <input className="input-field" placeholder="e.g. Tokyo Breakout" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Pairs (comma separated)</label>
              <input className="input-field" placeholder="USDJPY, GBPUSD, EURUSD" value={form.pairs} onChange={e=>setForm(f=>({...f,pairs:e.target.value}))}/>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="label">Colour</label>
            <div style={{ display:'flex', gap:8 }}>
              {COLORS.map(c=>(
                <div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{
                  width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer',
                  outline: form.color===c?`2px solid ${c}`:'2px solid transparent',
                  outlineOffset:2,
                }}/>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-primary" onClick={save}>Save system</button>
            <button className="btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {systems.map(s => {
          const sysT = trades.filter(t=>t.systemId===s.id);
          const pnl = sysT.reduce((a,t)=>a+t.result,0);
          const wins = sysT.filter(t=>t.result>0).length;
          const wr = sysT.length ? Math.round(wins/sysT.length*100) : 0;
          const accsUsed = [...new Set(sysT.map(t=>t.accountId))];
          return (
            <div key={s.id} className="card">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:s.color, boxShadow:`0 0 10px ${s.color}88`, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600 }}>{s.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{s.pairs?.join(' · ') || 'No pairs set'}</div>
                  </div>
                </div>
                <button onClick={()=>deleteSystem(s.id)} className="btn-ghost" style={{ padding:'4px 8px', color:'var(--red)' }}><Trash2 size={13}/></button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                {[
                  { lbl:'P&L', val: (pnl>=0?'+':'')+pnl.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0}), col: pnl>=0?'var(--accent)':'var(--red)' },
                  { lbl:'Win rate', val: `${wr}%`, col: wr>=60?'var(--accent)':wr>=45?'var(--amber)':'var(--red)' },
                  { lbl:'Trades', val: sysT.length, col:'var(--text-1)' },
                  { lbl:'Accounts', val: accsUsed.length, col:'var(--text-1)' },
                ].map(({lbl,val,col})=>(
                  <div key={lbl} style={{ background:'var(--bg-2)', borderRadius:'var(--radius-sm)', padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:3 }}>{lbl}</div>
                    <div style={{ fontSize:15, fontWeight:600, fontFamily:'JetBrains Mono,monospace', color:col }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:11, color:'var(--text-3)' }}>
                Active in: {accsUsed.map(id=>accounts.find(a=>a.id===id)?.name).filter(Boolean).join(', ') || 'No trades yet'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
