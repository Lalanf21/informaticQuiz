import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { migrate } from './db/migrate';
import { topicsRouter } from './routes/topics';
import { sessionsRouter } from './routes/sessions';
import { quizzesRouter } from './routes/quizzes';
import { scoresRouter } from './routes/scores';
import { errorHandler } from './middleware/errorHandler';

migrate();

export const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/topics', topicsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/scores', scoresRouter);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on :${PORT}`));
}
