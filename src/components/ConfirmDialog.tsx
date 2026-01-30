
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel 
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        border: '2px solid #000',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '4px 4px 0px #000',
      }}>
        <h3 style={{ 
          marginTop: 0, 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          marginBottom: '1rem' 
        }}>
          {title}
        </h3>
        <p style={{ 
          marginBottom: '2rem',
          fontSize: '1rem',
          lineHeight: '1.5',
          color: '#333'
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #000',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ff4444',
              background: '#ff4444',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
