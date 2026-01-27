

interface CommitButtonProps {
  onCommit: () => void;
  status: 'committed' | 'skipped' | 'empty';
  isLoading?: boolean;
}

export function CommitButton({ onCommit, status, isLoading = false }: CommitButtonProps) {
  const isCommitted = status === 'committed';
  
  return (
    <button
      onClick={onCommit}
      disabled={isLoading}
      style={{
        width: '100%',
        maxWidth: '400px',
        height: '80px',
        fontSize: '1.5rem',
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
        margin: '2rem auto'
      }}
    >
      {isLoading ? '...' : (isCommitted ? 'DONE FOR TODAY' : 'COMMIT TODAY')}
    </button>
  );
}
