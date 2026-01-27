import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Grid } from '../components/Grid';

export function UserProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  async function fetchProfile() {
    try {
      // Get profile
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
        
      if (error) throw error;
      setProfile(user);
      
      // Get habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select(`
            *,
            habit_logs (date, status)
        `)
        .eq('user_id', user.id)
        .eq('user_id', user.id)
        .eq('is_public', true);
        
      if (habitsError) throw habitsError;
      setHabits(habitsData || []);
      
    } catch (err: any) {
      console.error(err);
      // alert('Error loading profile: ' + err.message); 
      // Commented out to avoid spamming, but useful for debugging if user reports it.
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading profile...</div>;
  if (!profile) return <div>User not found</div>;

  return (
    <div className="user-profile">
       <Link to="/friends" style={{ marginBottom: '2rem', display: 'inline-block' }}>← Back to Friends</Link>
       
       <h1 className="title" style={{ fontSize: '2.5rem' }}>{profile.username}</h1>
       {/* Debug info */}
       <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>ID: {profile.id}</div> 
       
       <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginTop: '3rem' }}>
          {habits.map(habit => (
             <div key={habit.id}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{habit.title}</h2>
                <Grid logs={habit.habit_logs} interactive={false} />
             </div>
          ))}
          {habits.length === 0 && <div style={{ opacity: 0.5 }}>No public habits visible.</div>}
       </div>
    </div>
  );
}
