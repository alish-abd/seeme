

interface CommitButtonProps {
  onCommit: () => void;
  status: 'committed' | 'skipped' | 'empty';
  isLoading?: boolean;
  density?: 'big' | 'compact';
}

export function CommitButton({ onCommit, status, isLoading = false, density = 'big' }: CommitButtonProps) {
  const isCommitted = status === 'committed';
  
  return (
    <button
      onClick={onCommit}
      disabled={isLoading}
      style={{
        width: '100%',
        maxWidth: density === 'compact' ? 'none' : '400px',
        height: density === 'compact' ? '40px' : '80px',
        fontSize: density === 'compact' ? '0.8rem' : '1.5rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        backgroundColor: isCommitted ? '#000' : 'transparent',
        color: isCommitted ? '#fff' : '#000',
        border: '2px solid #000',
        cursor: isLoading ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: density === 'compact' ? '1rem auto' : '2rem auto'
      }}
    >
      {isLoading ? '...' : (isCommitted ? 'DONE' : 'COMMIT')}
    </button>
  );
}
