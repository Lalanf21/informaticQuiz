import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Topics from './pages/Topics';
import QuizPlay from './pages/QuizPlay';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topics" element={<Topics />} />
      <Route path="/quiz/:sessionId" element={<QuizPlay />} />
    </Routes>
  );
}
