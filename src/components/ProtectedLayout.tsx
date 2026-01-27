import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Auth } from './Auth';
import { Outlet, Link } from 'react-router-dom';
import { Onboarding } from './Onboarding';
import { ProfileSheet } from './ProfileSheet';

export function ProtectedLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false); // Track if we've attempted to load profile
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          fetchProfile(session.user.id);
      } else {
          setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          fetchProfile(session.user.id);
      } else {
          setLoading(false); // If logout
          setProfile(null);
          setProfileLoaded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  async function fetchProfile(userId: string) {
    try {
        const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        setProfile(data);
    } catch (e) {
        // Ignored, profile might not exist
    } finally {
        setProfileLoaded(true);
        setLoading(false);
    }
  }

  if (loading) {
    return <div className="layout">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  // If profile loaded but no username, show onboarding
  if (profileLoaded && (!profile || !profile.username)) {
      return <Onboarding userId={session.user.id} onComplete={() => fetchProfile(session.user.id)} />;
  }

  return (
    <div className="layout">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>seeme</Link>
            <Link to="/friends" style={{ fontSize: '1rem' }}>Friends</Link>
        </div>
        
        {/* Profile Section */}
        <div style={{ position: 'relative' }} ref={menuRef}>
            <div 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: '10px', 
                   cursor: 'pointer',
                   userSelect: 'none'
                }}
            >
                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {profile?.username || 'Profile'}
                </div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#eee',
                  borderRadius: '50%',
                  backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#000'
                }}>
                  {!profile?.avatar_url && (profile?.username?.[0]?.toUpperCase() || '?')}
                </div>
            </div>

            {/* Dropdown Menu */}
            {isMenuOpen && (
                <div style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    width: '150px',
                    zIndex: 100,
                    overflow: 'hidden'
                }}>
                    <button 
                        onClick={() => {
                            setIsMenuOpen(false);
                            setIsProfileSheetOpen(true);
                        }}
                        style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f5f5f5'
                        }}
                    >
                        Edit Profile
                    </button>
                    <button 
                         onClick={() => {
                            setIsMenuOpen(false);
                            supabase.auth.signOut();
                         }}
                        style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            color: '#e00'
                        }}
                    >
                        Log out
                    </button>
                </div>
            )}
        </div>
      </header>

      <Outlet context={{ session }} />

      <ProfileSheet 
        isOpen={isProfileSheetOpen} 
        onClose={() => setIsProfileSheetOpen(false)} 
        profile={profile}
        userId={session.user.id}
        onUpdate={() => fetchProfile(session.user.id)}
      />
    </div>
  );
}
