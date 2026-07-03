import { StoreProvider, useStore } from './store.jsx';
import Auth from './Auth';
import Nav from './Nav';
import Dashboard from './Dashboard';
import LogTrade from './LogTrade';
import TradeHistory from './TradeHistory';
import Systems from './Systems';
import Accounts from './Accounts';
import PositionSizer from './PositionSizer';

function Spinner() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid var(--bg-3)', borderTopColor:'var(--accent)', animation:'spin .7s linear infinite' }}/>
      <div style={{ fontSize:13, color:'var(--text-3)' }}>Loading your journal…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function AppInner() {
  const { user, authReady, loading, activeTab } = useStore();

  if (!authReady) return <Spinner/>;
  if (!user)      return <Auth/>;
  if (loading)    return <Spinner/>;

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Nav/>
      <main style={{ flex:1 }}>
        {activeTab==='dashboard' && <Dashboard/>}
        {activeTab==='log'       && <LogTrade/>}
        {activeTab==='history'   && <TradeHistory/>}
        {activeTab==='systems'   && <Systems/>}
        {activeTab==='accounts'  && <Accounts/>}
        {activeTab==='sizer'     && <PositionSizer/>}
      </main>
      <footer style={{ borderTop:'1px solid var(--border)', padding:'10px 24px', textAlign:'center', fontSize:11, color:'var(--text-3)' }}>
        FX Journal · v2.0 · <span style={{ color:'var(--accent)' }}>Cloud synced · Supabase</span>
      </footer>
    </div>
  );
}

export default function App() {
  return <StoreProvider><AppInner/></StoreProvider>;
}
