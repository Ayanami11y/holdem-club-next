import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/landing/LandingPage';
import { RoomPage } from '../pages/room/RoomPage';
import { TablePage } from '../pages/table/TablePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/create" element={<LandingPage initialEntryMode="host" />} />
      <Route path="/join" element={<LandingPage initialEntryMode="join" />} />
      <Route path="/room" element={<RoomPage />} />
      <Route path="/table" element={<TablePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
