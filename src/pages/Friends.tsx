import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext, Link } from 'react-router-dom';
import { UserSearch } from '../components/UserSearch';

export function Friends() {
  const { session } = useOutletContext<any>();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, [session]);

  async function fetchFriends() {
    try {
      // Fetch friendships where I am user_id (I added them) or friend_id (They added me)
      // And we need profiles.
      // Since supabase-js doesn't do deep polymoprhic stuff easily on self-referencing many-to-many via join table without view sometimes.
      // Let's do two queries or one complex one.
      
      // Get accepted friends
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          user_id,
          friend_id
        `)
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

      if (error) throw error;

      // Extract friend IDs
      const friendIds = friendships?.map(f => 
         f.user_id === session.user.id ? f.friend_id : f.user_id
      ) || [];
      
      if (friendIds.length === 0) {
          setLoading(false);
          return;
      }
      
      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
         .from('profiles')
         .select('*')
         .in('id', friendIds);
         
      if (profileError) throw profileError;
      
      // Map back
      const mapped = friendships?.map(f => {
          const fid = f.user_id === session.user.id ? f.friend_id : f.user_id;
          const profile = profiles?.find(p => p.id === fid);
          return { ...f, friend: profile };
      });
      
      setFriends(mapped?.filter(f => f.status === 'accepted') || []);
      setRequests(mapped?.filter(f => f.status === 'pending' && f.friend_id === session.user.id) || []); // Only requests waiting for ME
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function acceptRequest(id: string) {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
      fetchFriends();
  }
  
  // async function removeFriend(id: string) { ... }

  if (loading) return <div>Loading friends...</div>;

  return (
    <div className="friends-page">
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
         <h1 className="title" style={{ marginBottom: 0 }}>Friends</h1>
         <Link to="/" style={{ textDecoration: 'underline' }}>Dashboard</Link>
       </div>
       
       <UserSearch />
       
       {requests.length > 0 && (
         <div style={{ marginBottom: '2rem' }}>
           <h3>Requests</h3>
           {requests.map(r => (
             <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5' }}>
               <span>{r.friend?.username} wants to connect</span>
               <button onClick={() => acceptRequest(r.id)}>Accept</button>
             </div>
           ))}
         </div>
       )}
       
       <h3>Your Circle</h3>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           {friends.map(f => (
               <Link to={`/u/${f.friend?.username}`} key={f.id} style={{ 
                   display: 'block', 
                   padding: '1rem', 
                   border: '1px solid #000',
                   fontSize: '1.2rem',
                   fontWeight: 'bold'
               }}>
                   {f.friend?.username}
               </Link>
           ))}
           {friends.length === 0 && <div style={{ opacity: 0.5 }}>No friends yet.</div>}
       </div>
    </div>
  );
}
