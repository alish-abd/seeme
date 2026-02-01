import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Grid } from '../components/Grid';
import { CommitButton } from '../components/CommitButton';
import { useOutletContext, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export function Dashboard() {
  const { session, profile, onProfileUpdate } = useOutletContext<any>();
  const density = 'compact';
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'day'>(profile?.display_view || 'calendar');

  // Sync state with profile if it changes (e.g. reload or update)
  useEffect(() => {
    if (profile?.display_view) {
      setViewMode(profile.display_view);
    }
  }, [profile?.display_view]);

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
      newStatus = 'empty'; // Always toggle to empty if it exists
      operation = 'delete';
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

  async function toggleViewMode() {
    const newView = viewMode === 'calendar' ? 'day' : 'calendar';
    
    // Optimistic update
    setViewMode(newView);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_view: newView })
        .eq('id', session.user.id);

      if (error) throw error;
      onProfileUpdate(); // Refresh global profile state
    } catch (err) {
      console.error('Error saving view mode:', err);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="title" style={{ margin: 0 }}>Your Promises</h1>


        <button 
            onClick={toggleViewMode}
            style={{ 
                background: 'none', 
                border: '1px solid #000', 
                padding: '0.4rem 0.8rem', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                fontWeight: 'bold'
            }}
            className="density-toggle"
        >
            {viewMode === 'calendar' ? (
                <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Day View
                </>
            ) : (
                <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                    Grid View
                </>
            )}
        </button>
      </div>
      
      <form onSubmit={createHabit} style={{ marginBottom: '4rem', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          placeholder="New habit..." 
          value={newHabitTitle}
          onChange={e => setNewHabitTitle(e.target.value)}
          disabled={creating}
          style={{ padding: '1rem', fontSize: '1.2rem', borderBottom: '2px solid #000', borderTop: 'none', borderLeft: 'none', borderRight: 'none', background: 'transparent', width: '100%' }}
        />
        {newHabitTitle.trim() && (
          <button 
            type="submit"
            disabled={creating}
            style={{ 
              position: 'absolute', 
              right: 0, 
              background: '#000', 
              color: '#fff', 
              border: 'none', 
              padding: '0.6rem 1.2rem', 
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.8rem',
              letterSpacing: '0.05em'
            }}
          >
            {creating ? '...' : 'ADD'}
          </button>
        )}
      </form>

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

        {viewMode === 'day' ? (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              padding: '1rem', 
              fontSize: '1.5rem', 
              fontWeight: '500',
              borderBottom: '1px solid #eee',
              marginBottom: '1rem'
            }}>
              {format(new Date(), 'EEE, d MMMM')}
            </div>
            {habits.map(habit => {
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              const todayLog = habit.habit_logs?.find((l: any) => l.date === todayStr);
              const isCommitted = todayLog?.status === 'committed';

              return (
                <div key={habit.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '1.5rem 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <Link to={`/habit/${habit.id}`} style={{ fontSize: '1.5rem', fontWeight: '500' }}>
                    {habit.title}
                  </Link>
                  <div 
                    onClick={() => handleCommit(habit.id)}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      backgroundColor: isCommitted ? '#000' : '#e5e5e5',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {isCommitted && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
              display: 'grid', 
              gridTemplateColumns: density === 'compact' ? 'repeat(auto-fill, minmax(120px, 1fr))' : '1fr',
              gap: density === 'compact' ? '1rem' : '6rem',
          }} className={density === 'compact' ? 'dashboard-grid-compact' : ''}>
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
          </div>
        )}
        
        {habits.length === 0 && (
            <div style={{ opacity: 0.5, fontStyle: 'italic' }}>
                No habits yet. Start simple.
            </div>
        )}
      </div>
  );
}
