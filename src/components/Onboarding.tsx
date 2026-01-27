import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface OnboardingProps {
    userId: string;
    onComplete: () => void;
}

export function Onboarding({ userId, onComplete }: OnboardingProps) {
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!nickname.trim()) return;
        
        setLoading(true);
        try {
            const { error } = await supabase.from('profiles').upsert({
                id: userId,
                username: nickname.trim(),
                updated_at: new Date().toISOString()
            });
            
            if (error) throw error;
            onComplete();
        } catch (err: any) {
            alert("Error setting nickname: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: '#fff', zIndex: 2000, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
        }}>
            <h1 className="title" style={{ fontSize: '2rem', textAlign: 'center' }}>Welcome.</h1>
            <p style={{ marginBottom: '3rem', opacity: 0.6, fontSize: '1.2rem' }}>How should we call you?</p>
            
            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
                <input 
                    autoFocus
                    placeholder="Nickname"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    style={{ 
                        fontSize: '2rem', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #000',
                        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                        marginBottom: '2rem',
                        padding: '1rem'
                    }}
                />
                <button 
                    type="submit" 
                    disabled={loading || !nickname.trim()}
                    style={{ 
                        width: '100%', 
                        background: '#000', 
                        color: '#fff', 
                        padding: '1.5rem', 
                        borderRadius: '0',
                        border: 'none',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        opacity: !nickname.trim() ? 0.3 : 1
                    }}
                >
                    {loading ? 'Saving...' : 'Start'}
                </button>
            </form>
        </div>
    );
}
