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
    } catch (error: any) {
      setMessage(error.message);
    } finally {
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
