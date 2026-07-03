import { useStore } from './store.jsx';
import { LayoutDashboard, PenLine, BookOpen, Layers, Wallet, Calculator, Sun, Moon, LogOut } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard',      Icon: LayoutDashboard },
  { id: 'log',       label: 'Log Trade',      Icon: PenLine },
  { id: 'history',   label: 'History',        Icon: BookOpen },
  { id: 'systems',   label: 'Systems',        Icon: Layers },
  { id: 'accounts',  label: 'Accounts',       Icon: Wallet },
  { id: 'sizer',     label: 'Position Sizer', Icon: Calculator, accent: true },
];

export default function Nav() {
  const { activeTab, setActiveTab, theme, toggleTheme, user, signOut } = useStore();
  const initials = user?.email?.slice(0,2).toUpperCase() || 'FX';
  return (
    <nav style={{ background:'var(--nav-bg)', borderBottom:'1px solid var(--border)', padding:'0 18px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52, position:'sticky', top:0, zIndex:100, boxShadow:'var(--shadow)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:26, height:26, borderRadius:7, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:11, fontWeight:800, color:'#0D1117', fontFamily:'JetBrains Mono,monospace' }}>FX</span>
        </div>
        <span style={{ fontWeight:700, fontSize:13, letterSpacing:-.3 }}>Journal</span>
      </div>

      <div style={{ display:'flex', gap:1 }}>
        {TABS.map(({ id, label, Icon, accent }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:'var(--radius)',
            background: activeTab===id ? (accent?'var(--accent-dim)':'var(--bg-3)') : 'transparent',
            color: activeTab===id ? (accent?'var(--accent)':'var(--text-1)') : (accent?'var(--accent)':'var(--text-2)'),
            fontSize:12, fontWeight: activeTab===id ? 600 : (accent?500:400),
            border: accent?'1px solid rgba(0,212,168,.2)':'none', transition:'all .15s',
          }}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <button onClick={toggleTheme} className="btn-ghost" style={{ padding:'5px 9px' }} title="Toggle theme">
          {theme==='dark' ? <Sun size={14}/> : <Moon size={14}/>}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'var(--bg-2)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#00D4A8,#58A6FF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#0D1117' }}>{initials}</div>
          <span style={{ fontSize:11, color:'var(--text-2)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</span>
        </div>
        <button onClick={signOut} className="btn-ghost" style={{ padding:'5px 9px', color:'var(--red)' }} title="Sign out">
          <LogOut size={14}/>
        </button>
      </div>
    </nav>
  );
}
