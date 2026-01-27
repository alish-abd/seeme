import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  userId: string;
  onUpdate: () => void;
}

export function ProfileSheet({ isOpen, onClose, profile, userId, onUpdate }: ProfileSheetProps) {
  const [nickname, setNickname] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNickname(profile?.username || '');
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile]);

  async function handleSave() {
    setLoading(true);
    try {
      const updates = {
          id: userId, // Ensure ID is present for upsert
          username: nickname,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates); // Use upsert to create if not exists

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setLoading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Use userId instead of profile.id to prevent null crash
      const fileName = `${userId}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff',
        width: '100%',
        padding: '2rem',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        animation: 'slideUp 0.3s ease-out'
      }} onClick={e => e.stopPropagation()}>
        <style>
          {`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}
        </style>
        <h2 className="title" style={{ marginBottom: '1.5rem' }}>Edit Profile</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nickname</label>
          <input 
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Your name"
            style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Avatar Header</label>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               {avatarUrl && <img src={avatarUrl} alt="Avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />}
               <div>
                  <label 
                    htmlFor="avatar-upload" 
                    style={{ 
                        cursor: 'pointer', 
                        display: 'inline-block', 
                        padding: '0.5rem 1rem', 
                        border: '1px solid #000', 
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}
                  >
                    Upload Image
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    style={{ display: 'none' }}
                  />
               </div>
           </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleSave} disabled={loading} style={{ flex: 1, background: '#000', color: '#fff', padding: '1rem', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '1rem', border: '1px solid #ccc', background: 'transparent', borderRadius: '4px' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
