import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Grid } from '../components/Grid';
import { CommitButton } from '../components/CommitButton';
import { useOutletContext, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export function Dashboard() {
  const { session } = useOutletContext<any>();
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [session]);

  async function fetchHabits() {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select(`
          *,
          habit_logs (
            date,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .eq('user_id', session.user.id);

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    setCreating(true);

    try {
      const { error } = await supabase.from('habits').insert([
        {
          user_id: session.user.id,
          title: newHabitTitle,
          is_public: true 
        }
      ]);
      if (error) throw error;
      setNewHabitTitle('');
      fetchHabits();
    } catch (err) {
      alert('Error creating habit');
    } finally {
      setCreating(false);
    }
  }

  function calculateStreak(logs: any[]) {
     const committedDates = logs
      .filter((l: any) => l.status === 'committed')
      .map((l: any) => l.date)
      .sort((a: string, b: string) => b.localeCompare(a));

    if (committedDates.length === 0) return 0;

    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    let current = committedDates[0];
    if (current !== today && current !== yesterday) {
      return 0; 
    }
    
    let checkDate = parseISO(current);
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (committedDates.includes(dateStr)) {
        streak++;
        checkDate = new Date(checkDate.setDate(checkDate.getDate() - 1));
      } else {
        break;
      }
    }
    return streak;
  }

  async function handleCommit(habitId: string) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const habitIndex = habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return;

    const habit = habits[habitIndex];
    const existingLog = (habit.habit_logs || []).find((l: any) => l.date === todayStr);

    let newStatus = 'committed';
    let operation = 'insert';

    if (existingLog) {
      if (existingLog.status === 'committed') {
        newStatus = 'skipped';
        operation = 'update';
      } else if (existingLog.status === 'skipped') {
        newStatus = 'empty';
        operation = 'delete';
      }
    }

    // Optimistic UI Update
    const updatedHabits = [...habits];
    const updatedLogs = [...(habit.habit_logs || [])];

    if (operation === 'delete') {
      const idx = updatedLogs.findIndex(l => l.date === todayStr);
      if (idx !== -1) updatedLogs.splice(idx, 1);
    } else if (operation === 'update') {
      const idx = updatedLogs.findIndex(l => l.date === todayStr);
      if (idx !== -1) updatedLogs[idx] = { ...updatedLogs[idx], status: newStatus };
    } else {
      updatedLogs.push({ date: todayStr, status: newStatus });
    }

    updatedHabits[habitIndex] = { ...habit, habit_logs: updatedLogs };
    setHabits(updatedHabits);

    // Backend Update
    try {
      if (operation === 'delete') {
         await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', todayStr);
      } else if (operation === 'update') {
         await supabase.from('habit_logs').update({ status: newStatus }).eq('habit_id', habitId).eq('date', todayStr);
      } else {
         await supabase.from('habit_logs').insert({ habit_id: habitId, date: todayStr, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      fetchHabits(); // Revert on error
    }
  }

  async function toggleVisibility(habitId: string, currentStatus: boolean) {
    // Optimistic update
    const updatedHabits = habits.map(h => 
        h.id === habitId ? { ...h, is_public: !currentStatus } : h
    );
    setHabits(updatedHabits);

    try {
        const { error } = await supabase
            .from('habits')
            .update({ is_public: !currentStatus })
            .eq('id', habitId);

        if (error) throw error;
    } catch (err) {
        console.error('Error toggling visibility:', err);
        fetchHabits(); // Revert
        alert('Failed to update visibility');
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1 className="title">Your Promises</h1>
      
      <form onSubmit={createHabit} style={{ marginBottom: '4rem' }}>
        <input 
          placeholder="New habit..." 
          value={newHabitTitle}
          onChange={e => setNewHabitTitle(e.target.value)}
          disabled={creating}
          style={{ padding: '1rem', fontSize: '1.2rem', borderBottom: '2px solid #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', background: 'transparent', width: '100%' }}
        />
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6rem' }}>
        {habits.map(habit => {
          const streak = calculateStreak(habit.habit_logs || []);
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const todayLog = habit.habit_logs?.find((l: any) => l.date === todayStr);
          const todayStatus = todayLog ? todayLog.status : 'empty';

          return (
            <div key={habit.id} className="habit-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                <Link to={`/habit/${habit.id}`} style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                  {habit.title}
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        onClick={() => toggleVisibility(habit.id, habit.is_public)}
                        style={{ border: 'none', padding: 0, display: 'flex', alignItems: 'center', opacity: 0.5 }}
                        title={habit.is_public ? "Public (Visible to friends)" : "Private (Hidden)"}
                    >
                        {habit.is_public ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                                <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                                <path d="M6.75 12c0-.619.107-1.215.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 5.431c-.12.362-.12.752 0 1.113 1.489 4.471 5.708 7.697 10.68 7.697 1.027 0 2.018-.135 2.965-.39l-3.035-3.035A5.255 5.255 0 016.75 12z" />
                            </svg>
                        )}
                    </button>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <img src="/fire.png" alt="Streak" width="20" height="20" style={{ objectFit: 'contain' }} />
                        {streak}
                    </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <Grid 
                    logs={habit.habit_logs || []} 
                    interactive={false} 
                />
              </div>

              <CommitButton 
                status={todayStatus} 
                onCommit={() => handleCommit(habit.id)} 
              />
            </div>
          );
        })}
        
        {habits.length === 0 && (
            <div style={{ opacity: 0.5, fontStyle: 'italic' }}>
                No habits yet. Start simple.
            </div>
        )}
      </div>
    </div>
  );
}
