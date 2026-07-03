import { useState } from 'react';
import { supabase } from './supabase.js';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';

export default function Auth({ onAuth }) {
  const [mode,    setMode]    = useState('login'); // login | signup | reset
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null); // { type: 'ok'|'err', text }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        setMsg({ type:'ok', text:'Account created! Check your email to confirm, then log in.' });
        setMode('login'); setPass('');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMsg({ type:'ok', text:'Password reset email sent. Check your inbox.' });
        setMode('login');
      }
    } catch (err) {
      setMsg({ type:'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg-0)', padding:24,
    }}>
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:52, height:52, borderRadius:14, background:'var(--accent)', marginBottom:14 }}>
            <span style={{ fontSize:20, fontWeight:800, color:'#0D1117', fontFamily:'JetBrains Mono,monospace' }}>FX</span>
          </div>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:-.5 }}>FX Journal</div>
          <div style={{ fontSize:13, color:'var(--text-3)', marginTop:4 }}>Prop trader performance tracker</div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding:30 }}>
          <div style={{ fontSize:17, fontWeight:600, marginBottom:6 }}>
            {mode==='login' ? 'Sign in' : mode==='signup' ? 'Create account' : 'Reset password'}
          </div>
          <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:22 }}>
            {mode==='login' ? 'Welcome back. Sign in to your journal.' : mode==='signup' ? 'Start tracking your prop firm trades.' : 'Enter your email and we\'ll send a reset link.'}
          </div>

          {msg && (
            <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:'var(--radius)', fontSize:12, background: msg.type==='ok'?'var(--accent-dim)':'var(--red-dim)', color: msg.type==='ok'?'var(--accent)':'var(--red)', border:`1px solid ${msg.type==='ok'?'rgba(0,212,168,.3)':'rgba(248,81,73,.3)'}` }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label className="label">Email</label>
              <input className="input-field" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus/>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="label">Password</label>
                <div style={{ position:'relative' }}>
                  <input className="input-field" type={showPw?'text':'password'} placeholder="Min 6 characters" value={pass} onChange={e=>setPass(e.target.value)} required minLength={6} style={{ paddingRight:40 }}/>
                  <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', display:'flex' }}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'11px', fontSize:14, marginTop:4 }}>
              {loading ? 'Please wait…' : mode==='login' ? 'Sign in' : mode==='signup' ? 'Create account' : 'Send reset link'}
            </button>
          </form>

          <div className="divider"/>

          <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:12, textAlign:'center', color:'var(--text-3)' }}>
            {mode==='login' && <>
              <span>No account? <button onClick={()=>{setMode('signup');setMsg(null);}} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:12, fontWeight:500 }}>Create one</button></span>
              <span><button onClick={()=>{setMode('reset');setMsg(null);}} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', fontSize:12 }}>Forgot password?</button></span>
            </>}
            {mode==='signup' && <span>Already have an account? <button onClick={()=>{setMode('login');setMsg(null);}} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:12, fontWeight:500 }}>Sign in</button></span>}
            {mode==='reset'  && <span><button onClick={()=>{setMode('login');setMsg(null);}} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:12 }}>← Back to sign in</button></span>}
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:'var(--text-3)' }}>
          Your data is private — only you can see your trades
        </div>
      </div>
    </div>
  );
}
