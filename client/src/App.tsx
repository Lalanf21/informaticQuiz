import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Topics from './pages/Topics';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topics" element={<Topics />} />
    </Routes>
  );
}
