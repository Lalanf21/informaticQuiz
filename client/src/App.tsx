import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Topics from './pages/Topics';
import Challenge from './pages/Challenge';
import Campaign from './pages/Campaign';
import CampaignLevel from './pages/CampaignLevel';
import QuizPlay from './pages/QuizPlay';
import Result from './pages/Result';
import Leaderboard from './pages/Leaderboard';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminTopics from './pages/AdminTopics';
import AdminQuestions from './pages/AdminQuestions';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topics" element={<Topics />} />
      <Route path="/challenge" element={<Challenge />} />
      <Route path="/campaign" element={<Campaign />} />
      <Route path="/campaign/:topicId/:n" element={<CampaignLevel />} />
      <Route path="/quiz/:sessionId" element={<QuizPlay />} />
      <Route path="/result/:sessionId" element={<Result />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/admin/topics" element={<AdminTopics />} />
      <Route path="/admin/questions" element={<AdminQuestions />} />
    </Routes>
  );
}
