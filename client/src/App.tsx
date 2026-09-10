import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Topics from './pages/Topics';
import Challenge from './pages/Challenge';
import QuizPlay from './pages/QuizPlay';
import Result from './pages/Result';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topics" element={<Topics />} />
      <Route path="/challenge" element={<Challenge />} />
      <Route path="/quiz/:sessionId" element={<QuizPlay />} />
      <Route path="/result/:sessionId" element={<Result />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}
