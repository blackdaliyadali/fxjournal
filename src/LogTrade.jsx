import { useState } from 'react';
import { useStore } from './store.jsx';
import { Upload, X, Check, Image, Plus } from 'lucide-react';
import { supabase } from './supabase.js';

const COUNTRIES = ['UAE','UK','USA','Singapore','Japan','Germany','France','Australia','Canada','India','Malaysia','Thailand'];
const SESSIONS  = ['Tokyo','London','New York','Sydney'];
const PAIRS     = ['EURUSD','GBPUSD','USDJPY','XAUUSD','XAGUSD','GBPJPY','USDCHF','AUDUSD','USDCAD','NZDUSD','EURJPY','BTCUSD'];

export default function LogTrade() {
  const { accounts, systems, addTrade, user } = useStore();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    country: 'UAE', session: 'Tokyo',
    systemId: systems[0]?.id || '',
    screenshot: null,       // public URL after upload
    screenshotName: '',
    screenshotPreview: null, // local blob for preview only
    sharedAccounts: [],
    entries: [],
  });
  const [entry, setEntry] = useState({
    accountId: accounts[0]?.id || '',
    pair: 'USDJPY', direction: 'long',
    open:'', sl:'', tp:'', lots:'', rr:'1:2', result:'', notes:'',
  });

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Show preview immediately
    const preview = URL.createObjectURL(file);
    setForm(f => ({ ...f, screenshotPreview: preview, screenshotName: file.name, screenshot: null }));
    // Upload to Supabase Storage
    setUploading(true);
    try {
      const uid   = user?.id || 'anon';
      const ext   = file.name.split('.').pop();
      const path  = `${uid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('screenshots').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('screenshots').getPublicUrl(path);
      setForm(f => ({ ...f, screenshot: data.publicUrl }));
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: store as base64 if storage fails
      const reader = new FileReader();
      reader.onload = ev => setForm(f => ({ ...f, screenshot: ev.target.result }));
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  }

  function toggleShared(id) {
    setForm(f => ({ ...f, sharedAccounts: f.sharedAccounts.includes(id) ? f.sharedAccounts.filter(x=>x!==id) : [...f.sharedAccounts, id] }));
  }

  function addEntry() {
    if (!entry.accountId || !entry.open) return;
    setForm(f => ({ ...f, entries: [...f.entries, { ...entry, id: Date.now() }] }));
    setEntry(e => ({ ...e, open:'', sl:'', tp:'', lots:'', result:'', notes:'', rr:'1:2' }));
  }

  function saveAll() {
    form.entries.forEach(e => {
      addTrade({
        date: form.date, accountId: e.accountId, systemId: form.systemId,
        pair: e.pair, direction: e.direction,
        open: parseFloat(e.open)||0, sl: parseFloat(e.sl)||0, tp: parseFloat(e.tp)||0,
        lots: parseFloat(e.lots)||0, rr: e.rr||'',
        result: parseFloat(e.result)||0,
        country: form.country, session: form.session,
        screenshotUrl: form.screenshot,
        sharedAccounts: form.sharedAccounts,
        notes: e.notes,
      });
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setForm({ date:new Date().toISOString().slice(0,10), country:'UAE', session:'Tokyo', systemId:systems[0]?.id||'', screenshot:null, screenshotName:'', screenshotPreview:null, sharedAccounts:[], entries:[] });
    }, 1800);
  }

  const acc = id => accounts.find(a=>a.id===id);

  return (
    <div className="fade-in" style={{ padding:24, maxWidth:940, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      {saved && (
        <div style={{ background:'var(--accent-dim)', border:'1px solid rgba(0,212,168,.3)', borderRadius:'var(--radius)', padding:'12px 18px', display:'flex', alignItems:'center', gap:10, color:'var(--accent)' }}>
          <Check size={16}/> All trades saved!
        </div>
      )}

      {/* Session Info */}
      <div className="card">
        <div className="section-title">Session info</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ cursor:'pointer' }}
            />
          </div>
          <div>
            <label className="label">Country</label>
            <select className="input-field" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} style={{background:'var(--input-bg)',color:'var(--text-1)'}}>
              {COUNTRIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Session</label>
            <select className="input-field" value={form.session} onChange={e=>setForm(f=>({...f,session:e.target.value}))} style={{background:'var(--input-bg)',color:'var(--text-1)'}}>
              {SESSIONS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Trade system</label>
            <select className="input-field" value={form.systemId} onChange={e=>setForm(f=>({...f,systemId:e.target.value}))} style={{background:'var(--input-bg)',color:'var(--text-1)'}}>
              {systems.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Screenshot + sharing */}
      <div className="card">
        <div className="section-title">Screenshot + account sharing</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            {!(form.screenshotPreview || form.screenshot) ? (
              <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1.5px dashed var(--border-strong)', borderRadius:'var(--radius)', padding:28, cursor:'pointer', background:'var(--bg-2)', gap:8 }}>
                <Upload size={22} color="var(--text-3)"/>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text-2)' }}>Drop or click to upload</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>PNG, JPG · TradingView charts · Saved to cloud</div>
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
              </label>
            ) : (
              <div style={{ position:'relative', borderRadius:'var(--radius)', overflow:'hidden', border:'1px solid var(--border-strong)' }}>
                <img src={form.screenshotPreview || form.screenshot} alt="chart" style={{ width:'100%', height:180, objectFit:'cover' }}/>
                <button onClick={()=>setForm(f=>({...f,screenshot:null,screenshotName:'',screenshotPreview:null}))} style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.7)', border:'none', borderRadius:6, padding:5, color:'#fff', display:'flex', cursor:'pointer' }}>
                  <X size={13}/>
                </button>
                <div style={{ position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,.7)', borderRadius:4, padding:'2px 8px', fontSize:10, color:'#fff', display:'flex', alignItems:'center', gap:4 }}>
                  {uploading
                    ? <><div style={{ width:8, height:8, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'spin .6s linear infinite' }}/> Uploading to cloud…</>
                    : <><Check size={10} color="var(--accent)"/> Saved to storage</>
                  }
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
          </div>
          <div>
            <label className="label" style={{ marginBottom:8 }}>Share screenshot to accounts</label>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {accounts.map(a=>(
                <div key={a.id} onClick={()=>toggleShared(a.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:'var(--radius)', border:`1px solid ${form.sharedAccounts.includes(a.id)?'rgba(0,212,168,.4)':'var(--border)'}`, background:form.sharedAccounts.includes(a.id)?'var(--accent-dim)':'var(--bg-2)', cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${form.sharedAccounts.includes(a.id)?'var(--accent)':'var(--border-strong)'}`, background:form.sharedAccounts.includes(a.id)?'var(--accent)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {form.sharedAccounts.includes(a.id) && <Check size={10} color="#0D1117"/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{a.name}</div>
                    <div style={{ fontSize:10, color:'var(--text-3)' }}>{a.firm} · {a.platform}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trade entry */}
      <div className="card">
        <div className="section-title">Add trade entry</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div><label className="label">Account</label>
            <select className="input-field" value={entry.accountId} onChange={e=>setEntry(n=>({...n,accountId:e.target.value}))} style={{background:'var(--input-bg)',color:'var(--text-1)'}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.name} — ${a.size.toLocaleString()}</option>)}
            </select>
          </div>
          <div><label className="label">Pair</label>
            <select className="input-field" value={entry.pair} onChange={e=>setEntry(n=>({...n,pair:e.target.value}))} style={{background:'var(--input-bg)',color:'var(--text-1)'}}>
              {PAIRS.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:10 }}>
          <label className="label">Direction</label>
          <div style={{ display:'flex', gap:8 }}>
            {['long','short'].map(d=>(
              <button key={d} onClick={()=>setEntry(n=>({...n,direction:d}))} style={{ padding:'7px 22px', borderRadius:'var(--radius)', fontSize:12, fontWeight:600, border:`1px solid ${entry.direction===d?(d==='long'?'rgba(0,212,168,.5)':'rgba(248,81,73,.5)'):'var(--border)'}`, background:entry.direction===d?(d==='long'?'var(--accent-dim)':'var(--red-dim)'):'transparent', color:entry.direction===d?(d==='long'?'var(--accent)':'var(--red)'):'var(--text-2)' }}>
                {d.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:10 }}>
          {[['Open price','open','0.000'],['Stop loss','sl','SL price'],['Take profit','tp','TP price'],['Lot size','lots','0.00'],['RR (e.g 1:2)','rr','1:2'],['Result ($)','result','+/-']].map(([lbl,key,ph])=>(
            <div key={key}>
              <label className="label">{lbl}</label>
              <input className="input-field" placeholder={ph} value={entry[key]} onChange={e=>setEntry(n=>({...n,[key]:e.target.value}))}
                style={{ color: key==='result'?(parseFloat(entry.result)>0?'var(--accent)':parseFloat(entry.result)<0?'var(--red)':'var(--text-1)'):'var(--text-1)' }}/>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:12 }}>
          <label className="label">Notes</label>
          <textarea className="input-field" rows={2} placeholder="Setup notes, confluence, mistakes…" value={entry.notes} onChange={e=>setEntry(n=>({...n,notes:e.target.value}))} style={{ resize:'none' }}/>
        </div>
        <button className="btn-ghost" onClick={addEntry} style={{ width:'100%', justifyContent:'center', borderStyle:'dashed' }}>
          <Plus size={14}/> Add entry
        </button>
      </div>

      {form.entries.length>0 && (
        <div className="card">
          <div className="section-title">Entries to save ({form.entries.length})</div>
          {form.entries.map((e,i)=>{
            const a = acc(e.accountId);
            const sys = systems.find(s=>s.id===form.systemId);
            return (
              <div key={e.id} style={{ display:'flex', alignItems:'center', padding:'11px 0', borderBottom:i<form.entries.length-1?'1px solid var(--border)':'none', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{a?.name}</span>
                    <span className={`badge badge-${e.direction}`}>{e.direction}</span>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:13 }}>{e.pair}</span>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--text-2)' }}>RR {e.rr}</span>
                  </div>
                  <div style={{ display:'flex', gap:16, fontSize:11, fontFamily:'JetBrains Mono,monospace', color:'var(--text-2)' }}>
                    <span>Open: {e.open}</span>
                    <span style={{ color:'var(--red)' }}>SL: {e.sl}</span>
                    <span style={{ color:'var(--accent)' }}>TP: {e.tp}</span>
                    <span>Lots: {e.lots}</span>
                    <span className={parseFloat(e.result)>=0?'pnl-pos':'pnl-neg'}>{parseFloat(e.result)>=0?'+':''}${Math.abs(parseFloat(e.result)||0)}</span>
                  </div>
                </div>
                <button onClick={()=>setForm(f=>({...f,entries:f.entries.filter(x=>x.id!==e.id)}))} className="btn-ghost" style={{ padding:'4px 8px' }}><X size={13}/></button>
              </div>
            );
          })}
          <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
            <button className="btn-primary" onClick={saveAll} disabled={uploading}>
              {uploading ? 'Waiting for upload…' : <><Check size={15}/> Save {form.entries.length} trade{form.entries.length!==1?'s':''}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
