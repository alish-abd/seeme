import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Grid } from '../components/Grid';
import { format } from 'date-fns';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function HabitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

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
    setEditTitle(data.title);
    setEditDescription(data.description || '');
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

  async function handleUpdate() {
    if (!habit || !editTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('habits')
        .update({
          title: editTitle,
          description: editDescription
        })
        .eq('id', habit.id);

      if (error) throw error;
      
      setHabit({ ...habit, title: editTitle, description: editDescription });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating habit:', err);
      alert('Failed to update habit');
    }
  }

  async function handleDelete() {
    if (!habit) return;
    
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habit.id);

      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error deleting habit:', err);
      alert('Failed to delete habit');
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="habit-detail">
       <button onClick={() => navigate('/')} style={{ marginBottom: '2rem', border: 'none', paddingLeft: 0 }}>
         ← Back
       </button>
       
       {isEditing ? (
         <div style={{ marginBottom: '2rem' }}>
           <input 
             value={editTitle}
             onChange={e => setEditTitle(e.target.value)}
             style={{ fontSize: '3rem', fontWeight: 'bold', border: 'none', borderBottom: '2px solid #000', width: '100%', padding: '0.5rem 0', background: 'transparent', marginBottom: '1rem' }}
             placeholder="Habit title..."
           />
           <textarea 
             value={editDescription}
             onChange={e => setEditDescription(e.target.value)}
             style={{ width: '100%', border: '1px solid #eee', padding: '1rem', fontFamily: 'inherit', fontSize: '1rem', minHeight: '100px', outline: 'none' }}
             placeholder="Description (optional)..."
           />
           <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
             <button onClick={handleUpdate}>Save Changes</button>
             <button onClick={() => setIsEditing(false)} style={{ border: 'none', opacity: 0.5 }}>Cancel</button>
           </div>
         </div>
       ) : (
         <div style={{ marginBottom: '4rem' }}>
           <h1 className="title" style={{ fontSize: '4rem', marginBottom: '0.5rem', lineHeight: 1 }}>{habit.title}</h1>
           {habit.description && <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '1.1rem' }}>{habit.description}</p>}
           
           <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setIsEditing(true)}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', opacity: 0.6 }}
              >
                Edit
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', opacity: 0.6, color: '#ff4444', borderColor: '#ff4444' }}
              >
                Delete
              </button>
           </div>
         </div>
       )}
       
       <div style={{ marginBottom: '4rem' }}>
           <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '8rem', fontWeight: '900', lineHeight: 1, letterSpacing: '-0.05em' }}>
                 {habit.habit_logs.filter((l:any) => l.status === 'committed').length} 
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#666' }}>days total</span>
           </div>
        </div>

       <div style={{ margin: '0 auto', display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
         <Grid 
            logs={habit.habit_logs} 
            interactive={true} 
            onToggleDay={toggleDate} 
         />
       </div>

       <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
          Tap a day to toggle: Committed → Skipped → Empty
       </div>


       <ConfirmDialog
         isOpen={showDeleteConfirm}
         title="Delete Habit?"
         message="Are you sure you want to delete this habit? All progress will be lost permanently."
         confirmText="Delete"
         onConfirm={handleDelete}
         onCancel={() => setShowDeleteConfirm(false)}
       />
    </div>
  );
}
