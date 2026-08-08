import { Routes, Route } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Upload from './pages/Upload.jsx';
import Findings from './pages/Findings.jsx';
import Departments from './pages/Departments.jsx';
import Report from './pages/Report.jsx';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/findings" element={<Findings />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </Shell>
  );
}
