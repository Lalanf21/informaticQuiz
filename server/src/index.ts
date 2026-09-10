import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { migrate } from './db/migrate';
import { topicsRouter } from './routes/topics';
import { errorHandler } from './middleware/errorHandler';

migrate();

export const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/topics', topicsRouter);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on :${PORT}`));
}
