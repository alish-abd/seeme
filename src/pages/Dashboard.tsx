import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Grid } from '../components/Grid';
import { CommitButton } from '../components/CommitButton';
import { useOutletContext, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export function Dashboard() {
  const { session, profile, onProfileUpdate } = useOutletContext<any>();
  const density = profile?.display_density || 'big';
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



  async function toggleDensity() {
    const newDensity = density === 'big' ? 'compact' : 'big';
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ display_density: newDensity })
            .eq('id', session.user.id);

        if (error) throw error;
        onProfileUpdate(); // Refresh profile in parent
    } catch (err) {
        console.error('Error toggling density:', err);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="title" style={{ margin: 0 }}>Your Promises</h1>
        <button 
            onClick={toggleDensity}
            className="density-toggle"
            style={{ 
                background: 'none', 
                border: '1px solid #000', 
                padding: '0.4rem 0.8rem', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
            }}
        >
            {density === 'big' ? (
                <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                    Big
                </>
            ) : (
                <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Compact
                </>
            )}
        </button>
      </div>
      
      <form onSubmit={createHabit} style={{ marginBottom: '4rem' }}>
        <input 
          placeholder="New habit..." 
          value={newHabitTitle}
          onChange={e => setNewHabitTitle(e.target.value)}
          disabled={creating}
          style={{ padding: '1rem', fontSize: '1.2rem', borderBottom: '2px solid #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', background: 'transparent', width: '100%' }}
        />
      </form>

      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: density === 'compact' ? 'repeat(auto-fill, minmax(120px, 1fr))' : '1fr',
          gap: density === 'compact' ? '1rem' : '6rem',
      }} className={density === 'compact' ? 'dashboard-grid-compact' : ''}>
        <style>
            {`
                @media (min-width: 900px) {
                    .dashboard-grid-compact {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                }
                @media (max-width: 899px) and (min-width: 600px) {
                    .dashboard-grid-compact {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 599px) {
                    .dashboard-grid-compact {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                .density-toggle:hover {
                    background-color: #000 !important;
                    color: #fff !important;
                }
                .density-toggle:hover svg {
                    stroke: #fff !important;
                }
            `}
        </style>
        {habits.map(habit => {
          const streak = calculateStreak(habit.habit_logs || []);
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const todayLog = habit.habit_logs?.find((l: any) => l.date === todayStr);
          const todayStatus = todayLog ? todayLog.status : 'empty';

          return (
            <div key={habit.id} className="habit-item" style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: density === 'compact' ? '1px solid #eee' : 'none',
                padding: density === 'compact' ? '1rem' : '0',
                minWidth: 0,
                overflow: 'hidden',
                boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: density === 'compact' ? '0.75rem' : '1.5rem' }}>
                <Link to={`/habit/${habit.id}`} style={{ 
                    fontSize: density === 'compact' ? '0.9rem' : '1.8rem', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: density === 'compact' ? '75%' : '85%',
                    display: 'block'
                }}>
                  {habit.title}
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                    <div style={{ 
                        fontSize: density === 'compact' ? '0.9rem' : '1.2rem', 
                        fontWeight: 'bold', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px' 
                    }}>
                        <img src="/fire.png" alt="Streak" width={density === 'compact' ? "14" : "20"} height={density === 'compact' ? "14" : "20"} style={{ objectFit: 'contain' }} />
                        {streak}
                    </div>
                </div>
              </div>
              
              <div style={{ marginBottom: density === 'compact' ? '1rem' : '2rem' }}>
                <Grid 
                    logs={habit.habit_logs || []} 
                    interactive={false} 
                    density={density}
                />
              </div>

              <div style={{ marginTop: 'auto' }}>
                <CommitButton 
                    status={todayStatus} 
                    onCommit={() => handleCommit(habit.id)} 
                    density={density}
                />
              </div>
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
