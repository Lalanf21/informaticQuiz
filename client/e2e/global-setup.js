import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function globalSetup() {
  const root = path.resolve(__dirname, '..', '..');
  execSync('npm run db:migrate --prefix server && npm run db:seed --prefix server', {
    cwd: root,
    stdio: 'inherit',
  });
}
