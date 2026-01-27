import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedLayout } from './components/ProtectedLayout';
import { PublicLayout } from './components/PublicLayout';
import { Dashboard } from './pages/Dashboard';
import { HabitDetail } from './pages/HabitDetail';
import { PublicHabit } from './pages/PublicHabit';
import { Friends } from './pages/Friends';
import { UserProfile } from './pages/UserProfile';
import { Auth } from './components/Auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habit/:id" element={<HabitDetail />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/u/:username" element={<UserProfile />} />
        </Route>
        
        <Route element={<PublicLayout />}>
           <Route path="/s/:id" element={<PublicHabit />} />
           <Route path="/login" element={<Auth />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
