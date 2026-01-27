import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';

export function UserSearch() {
  const { session } = useOutletContext<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${query}%`)
        .neq('id', session.user.id) // Don't show self
        .limit(5);
        
      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }

  async function followUser(userId: string) {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: session.user.id,
          friend_id: userId,
          status: 'pending' // Or accepted immediately? Let's use pending logic if needed, but for MVP maybe just follow?
          // Prompt says "Friends can see...". "Friends view".
          // "They cannot comment... interact".
          // Let's assume request is needed.
        });
        
      if (error) {
        if (error.code === '23505') { // Unique violation
             alert('Already added');
        } else {
             throw error;
        }
      } else {
        alert('Friend request sent');
      }
    } catch (err: any) {
      alert('Error adding friend: ' + err.message);
    }
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Find Friends</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search username..."
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={searching}>Search</button>
      </form>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {results.map(user => (
          <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid #eee' }}>
            <span>{user.username || 'Unnamed'}</span>
            <button onClick={() => followUser(user.id)} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
              Add
            </button>
          </div>
        ))}
        {results.length === 0 && query && !searching && (
            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>No users found</div>
        )}
      </div>
    </div>
  );
}
