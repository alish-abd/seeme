import { Link, Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="layout">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <Link to="/" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>seeme</Link>
      </header>
      <Outlet />
    </div>
  );
}
