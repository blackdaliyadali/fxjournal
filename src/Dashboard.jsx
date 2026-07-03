import { useState, useMemo } from 'react';
import { useStore } from './store.jsx';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, Calendar, Filter } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';

const PERIODS = [
  { id:'week',  label:'This week' },
  { id:'month', label:'This month' },
  { id:'last',  label:'Last month' },
  { id:'all',   label:'All time' },
];

function AccountRing({ account, trades }) {
  const acTrades = trades.filter(t => t.accountId === account.id);
  const pnl = acTrades.reduce((s,t) => s + t.result, 0);
  const dailyLoss = -Math.min(0, pnl); // simplified
  const ddPct = (dailyLoss / account.size) * 100;
  const targetPct = Math.max(0, (pnl / account.size) * 100);
  const health = ddPct > account.dailyLimit*0.8 ? 'danger' : ddPct > account.dailyLimit*0.5 ? 'warn' : 'ok';
  const color = health==='ok' ? '#00D4A8' : health==='warn' ? '#E3B341' : '#F85149';
  const r = 34; const circ = 2*Math.PI*r;
  const typeBadge = { funded:'badge-funded', challenge:'badge-challenge', evaluation:'badge-eval' }[account.type];
  return (
    <div className="card fade-in" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontWeight:600, fontSize:14 }}>{account.name}</div>
          <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>{account.firm} · {account.platform}</div>
        </div>
        <span className={`badge ${typeBadge}`}>{account.type}</span>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:18 }}>
        <svg width={86} height={86} style={{ flexShrink:0 }}>
          <circle cx={43} cy={43} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={6}/>
          <circle cx={43} cy={43} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - Math.min(1, targetPct/account.target))}
            strokeLinecap="round"
            transform="rotate(-90 43 43)"
            style={{ filter: health==='ok' ? 'drop-shadow(0 0 6px rgba(0,212,168,.5))' : health==='warn' ? 'drop-shadow(0 0 6px rgba(227,179,65,.5))' : 'drop-shadow(0 0 6px rgba(248,81,73,.5))' }}
          />
          <text x={43} y={40} textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily="JetBrains Mono,monospace">
            {targetPct.toFixed(1)}%
          </text>
          <text x={43} y={53} textAnchor="middle" fill="var(--text-3)" fontSize={9}>profit</text>
        </svg>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:3, textTransform:'uppercase', letterSpacing:.4 }}>Daily drawdown</div>
            <div style={{ height:4, background:'var(--bg-3)', borderRadius:2 }}>
              <div style={{ height:4, borderRadius:2, background: ddPct>account.dailyLimit*0.8?'#F85149':ddPct>account.dailyLimit*0.5?'#E3B341':'#00D4A8', width:`${Math.min(100,(ddPct/account.dailyLimit)*100)}%`, transition:'width .4s' }}/>
            </div>
            <div style={{ fontSize:10, color:'var(--text-2)', marginTop:2 }}>{ddPct.toFixed(1)}% / {account.dailyLimit}%</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:3, textTransform:'uppercase', letterSpacing:.4 }}>Account size</div>
            <div style={{ fontSize:13, fontWeight:600, fontFamily:'JetBrains Mono,monospace', color:'var(--text-1)' }}>${account.size.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, paddingTop:10, borderTop:'1px solid var(--border)' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, color:'var(--text-3)' }}>Net P&L</div>
          <div className={pnl>=0?'pnl-pos':'pnl-neg'} style={{ fontSize:13 }}>{pnl>=0?'+':''}{pnl.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0})}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, color:'var(--text-3)' }}>Trades</div>
          <div style={{ fontSize:13, fontWeight:600, fontFamily:'JetBrains Mono,monospace' }}>{acTrades.length}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, color:'var(--text-3)' }}>Risk/trade</div>
          <div style={{ fontSize:13, fontWeight:600, fontFamily:'JetBrains Mono,monospace' }}>{account.riskPct}%</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:11, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:.5 }}>{label}</span>
        {Icon && <Icon size={14} color={color||'var(--text-3)'}/>}
      </div>
      <div style={{ fontSize:24, fontWeight:600, fontFamily:'JetBrains Mono,monospace', color: color||'var(--text-1)' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-3)' }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { accounts, systems, trades } = useStore();
  const [period, setPeriod] = useState('week');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterSystem, setFilterSystem] = useState('all');

  const filtered = useMemo(() => {
    const now = new Date();
    let range;
    if (period==='week')  range = { start: startOfWeek(now,{weekStartsOn:1}), end: endOfWeek(now,{weekStartsOn:1}) };
    if (period==='month') range = { start: startOfMonth(now), end: endOfMonth(now) };
    if (period==='last')  range = { start: startOfMonth(subMonths(now,1)), end: endOfMonth(subMonths(now,1)) };
    return trades.filter(t => {
      const d = parseISO(t.date);
      const inPeriod = period==='all' || isWithinInterval(d, range);
      const inAccount = filterAccount==='all' || t.accountId===filterAccount;
      const inSystem  = filterSystem==='all'  || t.systemId===filterSystem;
      return inPeriod && inAccount && inSystem;
    });
  }, [trades, period, filterAccount, filterSystem]);

  const totalPnl = filtered.reduce((s,t) => s+t.result, 0);
  const wins = filtered.filter(t => t.result>0);
  const wr = filtered.length ? Math.round((wins.length/filtered.length)*100) : 0;
  const avgRR = wins.length ? (wins.reduce((s,t)=>s+(t.result/Math.abs(t.result>0?t.result:1)),0)/wins.length).toFixed(1) : '—';

  const pnlBySystem = systems.map(s => ({
    ...s,
    pnl: filtered.filter(t=>t.systemId===s.id).reduce((a,t)=>a+t.result,0),
    trades: filtered.filter(t=>t.systemId===s.id).length,
    wins: filtered.filter(t=>t.systemId===s.id&&t.result>0).length,
  }));

  const chartData = useMemo(() => {
    const sorted = [...filtered].sort((a,b)=>a.date.localeCompare(b.date));
    let cum = 0;
    return sorted.map(t => { cum+=t.result; return { date: t.date.slice(5), pnl: cum, trade: t.result }; });
  }, [filtered]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active||!payload?.length) return null;
    const v = payload[0].value;
    return (
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border-strong)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
        <div style={{ color: v>=0?'var(--accent)':'var(--red)', fontFamily:'JetBrains Mono,monospace', fontWeight:600 }}>
          {v>=0?'+':''}{v?.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0})}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ padding:24, maxWidth:1280, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

      {/* Filter bar */}
      <div className="card" style={{ padding:'14px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Filter size={13} color="var(--text-3)"/>
            <span style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.5 }}>Period</span>
          </div>
          {PERIODS.map(p => (
            <button key={p.id} className={`tag ${period===p.id?'active':''}`} onClick={()=>setPeriod(p.id)}>{p.label}</button>
          ))}
          <div style={{ height:16, width:1, background:'var(--border)', margin:'0 4px' }}/>
          <button className={`tag ${filterAccount==='all'?'active':''}`} onClick={()=>setFilterAccount('all')}>All accounts</button>
          {accounts.map(a => (
            <button key={a.id} className={`tag ${filterAccount===a.id?'active':''}`} onClick={()=>setFilterAccount(a.id)}>{a.name}</button>
          ))}
          <div style={{ height:16, width:1, background:'var(--border)', margin:'0 4px' }}/>
          <button className={`tag ${filterSystem==='all'?'active':''}`} onClick={()=>setFilterSystem('all')}>All systems</button>
          {systems.map(s => (
            <button key={s.id} className={`tag ${filterSystem===s.id?'active':''}`} onClick={()=>setFilterSystem(s.id)}>{s.name}</button>
          ))}
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <StatCard label="Net P&L" value={(totalPnl>=0?'+':'')+totalPnl.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0})} color={totalPnl>=0?'var(--accent)':'var(--red)'} icon={totalPnl>=0?TrendingUp:TrendingDown}/>
        <StatCard label="Win rate" value={`${wr}%`} sub={`${wins.length}W / ${filtered.length-wins.length}L`} icon={Activity} color={wr>=60?'var(--accent)':wr>=45?'var(--amber)':'var(--red)'}/>
        <StatCard label="Avg RR" value={avgRR} sub="winning trades" icon={Target}/>
        <StatCard label="Trades" value={filtered.length} sub={`${accounts.length} accounts`} icon={Calendar}/>
      </div>

      {/* Chart + system breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>
        <div className="card">
          <div className="section-title">Cumulative P&L</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4A8" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#00D4A8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--text-3)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="pnl" stroke="#00D4A8" strokeWidth={2} fill="url(#pnlGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)', fontSize:13 }}>No trades in this period</div>
          )}
        </div>

        <div className="card">
          <div className="section-title">P&L by system</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {pnlBySystem.map(s => (
              <div key={s.id}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, boxShadow:`0 0 6px ${s.color}88` }}/>
                    <span style={{ fontSize:13, fontWeight:500 }}>{s.name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:11, color:'var(--text-3)' }}>{s.trades}T · {s.trades?Math.round(s.wins/s.trades*100):0}%W</span>
                    <span className={s.pnl>=0?'pnl-pos':'pnl-neg'} style={{ fontSize:13 }}>
                      {s.pnl>=0?'+':''}{s.pnl.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0})}
                    </span>
                  </div>
                </div>
                <div style={{ height:4, background:'var(--bg-3)', borderRadius:2 }}>
                  <div style={{ height:4, borderRadius:2, background:s.color, width:`${Math.min(100,Math.abs(s.pnl)/Math.max(1,totalPnl)*100)}%`, transition:'width .5s', boxShadow:`0 0 8px ${s.color}66` }}/>
                </div>
              </div>
            ))}
          </div>

          <div className="divider"/>
          <div className="section-title">P&L by account</div>
          {accounts.map(a => {
            const aPnl = filtered.filter(t=>t.accountId===a.id).reduce((s,t)=>s+t.result,0);
            const pct = totalPnl ? Math.abs(aPnl/totalPnl) : 0;
            return (
              <div key={a.id} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12, fontWeight:500 }}>{a.name}</span>
                  <span className={aPnl>=0?'pnl-pos':'pnl-neg'} style={{ fontSize:12 }}>
                    {aPnl>=0?'+':''}{aPnl.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0})}
                  </span>
                </div>
                <div style={{ height:3, background:'var(--bg-3)', borderRadius:2 }}>
                  <div style={{ height:3, borderRadius:2, background:'var(--accent)', width:`${pct*100}%`, transition:'width .5s' }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account rings */}
      <div className="section-title" style={{ marginBottom:0 }}>Account health</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {accounts.map(a => <AccountRing key={a.id} account={a} trades={filtered}/>)}
      </div>

      {/* Recent trades */}
      <div className="card">
        <div className="section-title">Recent trades</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Date','Account','System','Pair','Dir','Open','SL','TP','Lots','Country','Result','RR'].map(h => (
                  <th key={h} style={{ padding:'0 10px 10px', textAlign:'left', color:'var(--text-3)', fontWeight:500, fontSize:11, textTransform:'uppercase', letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,12).map(t => {
                const acc = accounts.find(a=>a.id===t.accountId);
                const sys = systems.find(s=>s.id===t.systemId);
                const rr = t.result>0 ? (t.result/((t.open-t.sl)*10000*t.lots)||1).toFixed(1) : '—';
                return (
                  <tr key={t.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px', color:'var(--text-2)', fontFamily:'JetBrains Mono,monospace', fontSize:11 }}>{t.date}</td>
                    <td style={{ padding:'10px', fontWeight:500 }}>{acc?.name}</td>
                    <td style={{ padding:'10px' }}><span className={`badge badge-${t.systemId}`}>{sys?.name}</span></td>
                    <td style={{ padding:'10px', fontFamily:'JetBrains Mono,monospace', fontWeight:600 }}>{t.pair}</td>
                    <td style={{ padding:'10px' }}><span className={`badge badge-${t.direction}`}>{t.direction}</span></td>
                    <td style={{ padding:'10px', fontFamily:'JetBrains Mono,monospace', color:'var(--text-2)', fontSize:11 }}>{t.open}</td>
                    <td style={{ padding:'10px', fontFamily:'JetBrains Mono,monospace', color:'var(--red)', fontSize:11 }}>{t.sl}</td>
                    <td style={{ padding:'10px', fontFamily:'JetBrains Mono,monospace', color:'var(--accent)', fontSize:11 }}>{t.tp}</td>
                    <td style={{ padding:'10px', fontFamily:'JetBrains Mono,monospace', color:'var(--text-2)' }}>{t.lots}</td>
                    <td style={{ padding:'10px', color:'var(--text-2)' }}>{t.country}</td>
                    <td style={{ padding:'10px' }}><span className={t.result>=0?'pnl-pos':'pnl-neg'}>{t.result>=0?'+':''}{t.result.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0})}</span></td>
                    <td style={{ padding:'10px', fontFamily:'JetBrains Mono,monospace', color: t.result>0?'var(--accent)':'var(--text-3)' }}>1:{rr}</td>
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
