import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Notices from './pages/Notices';
import Events from './pages/Events';
import Schedules from './pages/Schedules';
import Exams from './pages/Exams';
import Research from './pages/Research';
import Opportunities from './pages/Opportunities';
import Weather from './pages/Weather';
import Organization from './pages/Organization';
import UserApprovals from './pages/UserApprovals';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { ROLES } from './utils/constants';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/events" element={<Events />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/research" element={<Research />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/weather" element={<Weather />} />
        <Route
          path="/organization"
          element={
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN]}>
              <Organization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD]}>
              <UserApprovals />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
