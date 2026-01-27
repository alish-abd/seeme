import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Grid } from '../components/Grid';
import { format } from 'date-fns';
import { CommitButton } from '../components/CommitButton';

export function HabitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      .single();

    if (error) {
      alert('Habit not found');
      navigate('/');
      return;
    }
    setHabit(data);
    setLoading(false);
  }

  async function toggleDate(date: Date) {
    if (!habit) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check existing log
    const existingLog = habit.habit_logs.find((l: any) => l.date === dateStr);
    
    let newStatus = 'committed';
    let operation = 'insert';
    
    if (existingLog) {
      if (existingLog.status === 'committed') {
        newStatus = 'skipped';
        operation = 'update';
      } else if (existingLog.status === 'skipped') {
        newStatus = 'empty'; // which means DELETE
        operation = 'delete';
      }
    }

    // Optimistic update
    const prevLogs = [...habit.habit_logs];
    let newLogs = [...prevLogs];
    
    if (operation === 'delete') {
      newLogs = newLogs.filter(l => l.date !== dateStr);
    } else if (operation === 'update') {
      newLogs = newLogs.map(l => l.date === dateStr ? { ...l, status: newStatus } : l);
    } else {
      newLogs.push({ date: dateStr, status: newStatus });
    }
    
    setHabit({ ...habit, habit_logs: newLogs });

    try {
      if (operation === 'delete') {
        await supabase
            .from('habit_logs')
            .delete()
            .eq('habit_id', habit.id)
            .eq('date', dateStr);
      } else if (operation === 'update') {
         await supabase
            .from('habit_logs')
            .update({ status: newStatus })
            .eq('habit_id', habit.id)
            .eq('date', dateStr);       
      } else {
        await supabase
            .from('habit_logs')
            .insert({
                habit_id: habit.id,
                date: dateStr,
                status: newStatus
            });
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setHabit({ ...habit, habit_logs: prevLogs });
    }
  }

  // Helper to get today's status
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayLog = habit?.habit_logs?.find((l: any) => l.date === todayStr);
  const todayStatus = todayLog ? todayLog.status : 'empty';

  async function handleCommitToday() {
      // If already committed, do nothing via button? Or toggle?
      // "Commit Today" implies action. If done, button says "DONE".
      // Let's make it toggle if they really want, but primarilly it commits.
      // Actually toggleDate handles the logic: Empty -> Committed.
      // If Committed -> Skipped.
      // If Skipped -> Empty.
      // So if status is 'committed', clicking button will make it skipped? That might be annoying if accidental.
      // But consistent with grid.
      // Let's just call toggleDate(new Date()).
      await toggleDate(new Date());
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="habit-detail">
       <button onClick={() => navigate('/')} style={{ marginBottom: '2rem', border: 'none', paddingLeft: 0 }}>
         ← Back
       </button>
       
       <h1 className="title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{habit.title}</h1>
       {habit.description && <p style={{ color: '#666', marginBottom: '2rem' }}>{habit.description}</p>}
       
       <div style={{ marginBottom: '2rem' }}>
           <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '6rem', fontWeight: '900', lineHeight: 1, letterSpacing: '-0.05em' }}>
                 {habit.habit_logs.filter((l:any) => l.status === 'committed').length} 
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#666' }}>days total</span>
           </div>
        </div>

       <CommitButton 
          onCommit={handleCommitToday} 
          status={todayStatus} 
       />

       <div style={{ margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
         <Grid 
            logs={habit.habit_logs} 
            interactive={true} 
            onToggleDay={toggleDate} 
         />
       </div>

       <div style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>Tap a day to toggle: Committed → Skipped → Empty</div>
          
          <button 
             onClick={() => {
               const url = `${window.location.origin}/s/${habit.id}`;
               navigator.clipboard.writeText(url);
               alert('Public link copied to clipboard!');
             }}
             style={{ marginTop: '1rem', alignSelf: 'center' }}
          >
             Share Public Link
          </button>
       </div>
    </div>
  );
}
