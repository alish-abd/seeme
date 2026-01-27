import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Grid } from '../components/Grid';

export function PublicHabit() {
  const { id } = useParams();
  const [habit, setHabit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabit();
  }, [id]);

  async function fetchHabit() {
    if (!id) return;
    const { data, error } = await supabase
      .from('habits')
      .select(`
        *,
        habit_logs (
          date,
          status
        )
      `)
      .eq('id', id)
      // .eq('is_public', true) // Technically should enforce this from RLS or here.
      // RLS "Public habits are viewable by everyone" handles it.
      // But if RLS fails or I didn't set is_public=true in DB, it will return null.
      .single();

    if (error || !data) {
       // Silent fail or show error
       setLoading(false);
       return;
    }
    setHabit(data);
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;
  if (!habit) return <div>Habit not found or private.</div>;

  return (
    <div className="habit-detail">
       <div style={{ marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', opacity: 0.5 }}>
         Shared Habit
       </div>
       
       <h1 className="title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{habit.title}</h1>
       {habit.description && <p style={{ color: '#666', marginBottom: '2rem' }}>{habit.description}</p>}
       
       <div style={{ marginBottom: '4rem' }}>
          <div style={{ fontSize: '8rem', fontWeight: '900', lineHeight: 1, letterSpacing: '-0.05em' }}>
             {habit.habit_logs.filter((l:any) => l.status === 'committed').length} 
             <span style={{ fontSize: '1.5rem', fontWeight: 'normal', marginLeft: '1rem' }}>days total</span>
          </div>
       </div>

       <div style={{ margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
         <Grid 
            logs={habit.habit_logs} 
            interactive={false} 
         />
       </div>
       
       <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <a href="/" style={{ fontSize: '0.9rem', textDecoration: 'underline' }}>Create your own</a>
       </div>
    </div>
  );
}
