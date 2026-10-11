import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import PlanPage from './pages/PlanPage';
import GroupsPage from './pages/GroupsPage';
import SettingsPage from './pages/SettingsPage';
import { TimetableProvider } from './state/TimetableProvider';

export default function App() {
  return (
    <HashRouter>
      <TimetableProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/plan" replace />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/plan" replace />} />
          </Route>
        </Routes>
      </TimetableProvider>
    </HashRouter>
  );
}
