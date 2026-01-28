import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: '4rem auto' }}>
      <h1 className="title">{mode === 'signin' ? 'Enter' : 'Join'}</h1>
      
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {message && (
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {message}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', gap: '1rem' }}>
           <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
           <span style={{ fontSize: '0.8rem', color: '#999' }}>OR</span>
           <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin} 
          disabled={loading}
          style={{ 
            background: '#fff', 
            color: '#000', 
            border: '2px solid #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.419 2.019.957 4.962l3.007 2.332c.708-2.127 2.692-3.713 5.036-3.713z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </form>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        {mode === 'signin' ? (
          <>
            New here? <button onClick={() => setMode('signup')} style={{ border: 'none', padding: 0, textDecoration: 'underline' }}>Create account</button>
          </>
        ) : (
          <>
            Have an account? <button onClick={() => setMode('signin')} style={{ border: 'none', padding: 0, textDecoration: 'underline' }}>Sign in</button>
          </>
        )}
      </div>
    </div>
  );
}
