import { useState } from 'react';
import { useStore } from './store.jsx';
import { Trash2, Edit2, Image, X, Check, ChevronDown, ChevronUp } from 'lucide-react';

function ScreenshotModal({ url, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ maxWidth:900, width:'100%', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:-36, right:0, background:'rgba(0,0,0,.6)', border:'none', borderRadius:8, padding:'4px 8px', color:'#fff', display:'flex', alignItems:'center', gap:4, cursor:'pointer', fontSize:12 }}>
          <X size={14}/> Close
        </button>
        <img src={url} alt="Trade screenshot" style={{ width:'100%', borderRadius:12, border:'1px solid var(--border-strong)' }}/>
      </div>
    </div>
  );
}

function EditModal({ trade, accounts, systems, onSave, onClose }) {
  const [form, setForm] = useState({ ...trade });
  const f = (k,v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:600 }}>Edit trade</div>
          <button onClick={onClose} className="btn-ghost" style={{ padding:'4px 8px' }}><X size={14}/></button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div><label className="label">Date</label><input type="date" className="input-field" value={form.date} onChange={e=>f('date',e.target.value)}/></div>
          <div><label className="label">Account</label>
            <select className="input-field" value={form.accountId} onChange={e=>f('accountId',e.target.value)} style={{background:'var(--input-bg)',color:'var(--text-1)'}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div><label className="label">System</label>
            <select className="input-field" value={form.systemId} onChange={e=>f('systemId',e.target.value)} style={{background:'var(--input-bg)',color:'var(--text-1)'}}>
              {systems.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Pair</label><input className="input-field" value={form.pair} onChange={e=>f('pair',e.target.value)}/></div>
          <div><label className="label">Direction</label>
            <select className="input-field" value={form.direction} onChange={e=>f('direction',e.target.value)} style={{background:'var(--input-bg)',color:'var(--text-1)'}}>
              <option value="long">Long</option><option value="short">Short</option>
            </select>
          </div>
          <div><label className="label">RR (e.g. 1:2)</label><input className="input-field" placeholder="1:2" value={form.rr||''} onChange={e=>f('rr',e.target.value)}/></div>
          <div><label className="label">Open price</label><input type="number" className="input-field" value={form.open} onChange={e=>f('open',parseFloat(e.target.value))}/></div>
          <div><label className="label">Stop loss</label><input type="number" className="input-field" value={form.sl} onChange={e=>f('sl',parseFloat(e.target.value))}/></div>
          <div><label className="label">Take profit</label><input type="number" className="input-field" value={form.tp} onChange={e=>f('tp',parseFloat(e.target.value))}/></div>
          <div><label className="label">Lot size</label><input type="number" className="input-field" value={form.lots} onChange={e=>f('lots',parseFloat(e.target.value))}/></div>
          <div><label className="label">Result ($)</label><input type="number" className="input-field" value={form.result} onChange={e=>f('result',parseFloat(e.target.value))}/></div>
          <div><label className="label">Country</label><input className="input-field" value={form.country||''} onChange={e=>f('country',e.target.value)}/></div>
        </div>
        <div style={{ marginBottom:12 }}>
          <label className="label">Notes</label>
          <textarea className="input-field" rows={3} value={form.notes||''} onChange={e=>f('notes',e.target.value)} style={{ resize:'none' }}/>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={()=>{ onSave(form); onClose(); }}><Check size={14}/>Save changes</button>
        </div>
      </div>
    </div>
  );
}

export default function TradeHistory() {
  const { trades, accounts, systems, updateTrade, deleteTrade } = useStore();
  const [filterAcc, setFilterAcc]   = useState('all');
  const [filterSys, setFilterSys]   = useState('all');
  const [filterDir, setFilterDir]   = useState('all');
  const [search,    setSearch]       = useState('');
  const [sortKey,   setSortKey]      = useState('date');
  const [sortAsc,   setSortAsc]      = useState(false);
  const [viewShot,  setViewShot]     = useState(null);
  const [editTrade, setEditTrade]    = useState(null);
  const [confirmDel,setConfirmDel]   = useState(null);

  function exportPDF() {
    const win = window.open('','_blank');
    const rows = filtered.map(t => {
      const a = accounts.find(x=>x.id===t.accountId);
      const s = systems.find(x=>x.id===t.systemId);
      return `<tr>
        <td>${t.date}</td><td>${a?.name||''}</td><td>${s?.name||''}</td>
        <td>${t.pair}</td><td>${t.direction}</td><td>${t.rr||'—'}</td>
        <td>${t.open}</td><td>${t.sl}</td><td>${t.tp}</td><td>${t.lots}</td>
        <td>${t.country||''}</td>
        <td style="color:${t.result>=0?'#00D4A8':'#F85149'};font-weight:600">${t.result>=0?'+':''}$${t.result}</td>
        <td>${t.notes||''}</td>
      </tr>`;
    }).join('');
    const totalPnl = filtered.reduce((s,t)=>s+t.result,0);
    const wins = filtered.filter(t=>t.result>0).length;
    win.document.write(`<!DOCTYPE html><html><head><title>FX Journal — Trade History</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; color: #0D1117; padding: 24px; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .meta { font-size: 12px; color: #57606a; margin-bottom: 20px; }
      .stats { display: flex; gap: 24px; margin-bottom: 20px; }
      .stat { background: #f4f6f9; border-radius: 8px; padding: 12px 18px; }
      .stat-val { font-size: 22px; font-weight: 700; font-family: monospace; }
      .stat-lbl { font-size: 11px; color: #57606a; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #f4f6f9; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; color: #57606a; }
      td { padding: 8px; border-bottom: 1px solid #e4e8ee; }
      tr:hover td { background: #f9fafb; }
      @media print { .no-print { display: none; } }
    </style></head><body>
    <h1>FX Journal — Trade History</h1>
    <div class="meta">Exported ${new Date().toLocaleString()} · ${filtered.length} trades</div>
    <div class="stats">
      <div class="stat"><div class="stat-val" style="color:${totalPnl>=0?'#00D4A8':'#F85149'}">${totalPnl>=0?'+':''}$${totalPnl.toLocaleString()}</div><div class="stat-lbl">Net P&L</div></div>
      <div class="stat"><div class="stat-val">${filtered.length ? Math.round(wins/filtered.length*100) : 0}%</div><div class="stat-lbl">Win rate</div></div>
      <div class="stat"><div class="stat-val">${filtered.length}</div><div class="stat-lbl">Total trades</div></div>
      <div class="stat"><div class="stat-val">${wins}</div><div class="stat-lbl">Wins</div></div>
    </div>
    <table><thead><tr>
      <th>Date</th><th>Account</th><th>System</th><th>Pair</th><th>Dir</th><th>RR</th>
      <th>Open</th><th>SL</th><th>TP</th><th>Lots</th><th>Country</th><th>Result</th><th>Notes</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload=()=>window.print();</script>
    </body></html>`);
    win.document.close();
  }

  function toggleSort(k) {
    if (sortKey===k) setSortAsc(a=>!a);
    else { setSortKey(k); setSortAsc(true); }
  }

  const filtered = trades
    .filter(t => {
      if (filterAcc!=='all' && t.accountId!==filterAcc) return false;
      if (filterSys!=='all' && t.systemId!==filterSys)  return false;
      if (filterDir!=='all' && t.direction!==filterDir) return false;
      if (search && !t.pair.toLowerCase().includes(search.toLowerCase()) && !t.notes?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a,b) => {
      let va=a[sortKey], vb=b[sortKey];
      if (typeof va==='string') { va=va.toLowerCase(); vb=vb.toLowerCase(); }
      return sortAsc ? (va>vb?1:-1) : (va<vb?1:-1);
    });

  const totalPnl = filtered.reduce((s,t)=>s+t.result,0);
  const wins = filtered.filter(t=>t.result>0).length;

  function SortIcon({ k }) {
    if (sortKey!==k) return null;
    return sortAsc ? <ChevronUp size={11}/> : <ChevronDown size={11}/>;
  }

  return (
    <div className="fade-in" style={{ padding:24, maxWidth:1400, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      {viewShot  && <ScreenshotModal url={viewShot} onClose={()=>setViewShot(null)}/>}
      {editTrade && <EditModal trade={editTrade} accounts={accounts} systems={systems} onSave={updateTrade} onClose={()=>setEditTrade(null)}/>}
      {confirmDel && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:380, textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:10 }}>Delete trade?</div>
            <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:20 }}>This cannot be undone.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn-ghost" onClick={()=>setConfirmDel(null)}>Cancel</button>
              <button className="btn-primary" style={{ background:'var(--red)' }} onClick={()=>{ deleteTrade(confirmDel); setConfirmDel(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ fontSize:18, fontWeight:600 }}>Trade history</h2>
        <button className="btn-ghost" style={{ fontSize:12 }} onClick={exportPDF}>Export PDF / Print</button>
      </div>

      <div className="card" style={{ padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <input className="input-field" placeholder="Search pair or notes…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:180 }}/>
          <div style={{ height:24, width:1, background:'var(--border)' }}/>
          <button className={`tag ${filterAcc==='all'?'active':''}`} onClick={()=>setFilterAcc('all')}>All accounts</button>
          {accounts.map(a=><button key={a.id} className={`tag ${filterAcc===a.id?'active':''}`} onClick={()=>setFilterAcc(a.id)}>{a.name}</button>)}
          <div style={{ height:24, width:1, background:'var(--border)' }}/>
          <button className={`tag ${filterSys==='all'?'active':''}`} onClick={()=>setFilterSys('all')}>All systems</button>
          {systems.map(s=><button key={s.id} className={`tag ${filterSys===s.id?'active':''}`} onClick={()=>setFilterSys(s.id)}>{s.name}</button>)}
          <div style={{ height:24, width:1, background:'var(--border)' }}/>
          {['all','long','short'].map(d=><button key={d} className={`tag ${filterDir===d?'active':''}`} onClick={()=>setFilterDir(d)}>{d==='all'?'All directions':d}</button>)}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {[
          { lbl:'Filtered trades', val: filtered.length },
          { lbl:'Net P&L', val:(totalPnl>=0?'+':'')+totalPnl.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0}), col:totalPnl>=0?'var(--accent)':'var(--red)' },
          { lbl:'Win rate', val:`${filtered.length?Math.round(wins/filtered.length*100):0}%` },
          { lbl:'Wins / Losses', val:`${wins} / ${filtered.length-wins}` },
        ].map(({lbl,val,col})=>(
          <div key={lbl} className="card" style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>{lbl}</div>
            <div style={{ fontSize:20, fontWeight:700, fontFamily:'JetBrains Mono,monospace', color:col||'var(--text-1)' }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-2)' }}>
                {[['date','Date'],['accountId','Account'],['systemId','System'],['pair','Pair'],['direction','Dir'],['rr','RR'],['open','Open'],['sl','SL'],['tp','TP'],['lots','Lots'],['country','Country'],['result','Result']].map(([k,h])=>(
                  <th key={k} onClick={()=>toggleSort(k)} style={{ padding:'10px 12px', textAlign:'left', color:'var(--text-3)', fontWeight:500, fontSize:10, textTransform:'uppercase', letterSpacing:.4, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
                    {h} <SortIcon k={k}/>
                  </th>
                ))}
                <th style={{ padding:'10px 12px', color:'var(--text-3)', fontWeight:500, fontSize:10 }}>Photo</th>
                <th style={{ padding:'10px 12px', color:'var(--text-3)', fontWeight:500, fontSize:10 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={14} style={{ padding:32, textAlign:'center', color:'var(--text-3)' }}>No trades match filters</td></tr>
              )}
              {filtered.map(t => {
                const acc = accounts.find(a=>a.id===t.accountId);
                const sys = systems.find(s=>s.id===t.systemId);
                return (
                  <tr key={t.id} style={{ borderBottom:'1px solid var(--border)', transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-2)'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'10px 12px', color:'var(--text-2)', fontFamily:'JetBrains Mono,monospace', fontSize:11, whiteSpace:'nowrap' }}>{t.date}</td>
                    <td style={{ padding:'10px 12px', fontWeight:500, whiteSpace:'nowrap' }}>{acc?.name}</td>
                    <td style={{ padding:'10px 12px' }}><span className={`badge badge-${t.systemId}`}>{sys?.name}</span></td>
                    <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{t.pair}</td>
                    <td style={{ padding:'10px 12px' }}><span className={`badge badge-${t.direction}`}>{t.direction}</span></td>
                    <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--text-2)' }}>{t.rr||'—'}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono,monospace', color:'var(--text-2)', fontSize:11 }}>{t.open}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono,monospace', color:'var(--red)', fontSize:11 }}>{t.sl}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono,monospace', color:'var(--accent)', fontSize:11 }}>{t.tp}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono,monospace', color:'var(--text-2)' }}>{t.lots}</td>
                    <td style={{ padding:'10px 12px', color:'var(--text-2)', fontSize:11 }}>{t.country}</td>
                    <td style={{ padding:'10px 12px' }}><span className={t.result>=0?'pnl-pos':'pnl-neg'}>{t.result>=0?'+':''}{t.result.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0})}</span></td>
                    <td style={{ padding:'10px 12px' }}>
                      {t.screenshotUrl
                        ? <button className="btn-ghost" style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>setViewShot(t.screenshotUrl)}><Image size={12}/>View</button>
                        : <span style={{ fontSize:11, color:'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-ghost" style={{ padding:'3px 8px' }} onClick={()=>setEditTrade(t)}><Edit2 size={12}/></button>
                        <button className="btn-ghost" style={{ padding:'3px 8px', color:'var(--red)' }} onClick={()=>setConfirmDel(t.id)}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
