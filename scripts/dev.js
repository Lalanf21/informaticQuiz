const net = require('net');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'informaticquiz.db');

// Parse .env helper
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      result[key] = val;
    }
  }
  return result;
}

// Check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, '0.0.0.0');
  });
}

// Find available port with dynamic increment
async function findAvailablePort(startPort, label) {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    console.log(`[DEV] Port ${port} (${label}) sedang digunakan, mencoba port ${port + 1}...`);
    port++;
  }
  return port;
}

// Poll HTTP endpoint until ready
function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on('error', retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    }

    function retry() {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for ${url}`));
      } else {
        setTimeout(tryConnect, 250);
      }
    }

    tryConnect();
  });
}

async function main() {
  console.log('\n[DEV] Memeriksa persiapan InformaticQuiz...');

  // 1. Ensure DB migrated & seeded
  if (!fs.existsSync(DB_FILE)) {
    console.log('[DEV] Database belum ada. Menjalankan migrasi dan seed...');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    execSync('npm run db:migrate --prefix server', { cwd: ROOT_DIR, stdio: 'inherit' });
    execSync('npm run db:seed --prefix server', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('[DEV] Migrasi dan seed selesai.');
  }

  // 2. Determine backend port dynamically
  const initialServerPort = Number(process.env.PORT) || 3001;
  const serverPort = await findAvailablePort(initialServerPort, 'backend');

  // Load server .env
  const serverEnv = {
    ...parseEnvFile(path.join(SERVER_DIR, '.env')),
    ...process.env,
    PORT: String(serverPort),
    DATABASE_PATH: path.join(ROOT_DIR, 'data', 'informaticquiz.db'),
  };

  console.log(`[DEV] Memulai Server Backend di port ${serverPort}...`);

  function killProc(proc) {
    if (!proc || !proc.pid) return;
    try {
      process.kill(-proc.pid, 'SIGINT');
    } catch {
      try {
        proc.kill('SIGINT');
      } catch {}
    }
  }

  let cleanedUp = false;
  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    console.log('\n[DEV] Menghentikan semua dev server...');
    killProc(serverProcess);
    killProc(clientProcess);
    serverProcess = null;
    clientProcess = null;
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    if (!cleanedUp) {
      cleanedUp = true;
      killProc(serverProcess);
      killProc(clientProcess);
    }
  });

  // 3. Spawn Backend Server
  serverProcess = spawn('npm', ['run', 'dev', '--prefix', 'server'], {
    cwd: ROOT_DIR,
    env: serverEnv,
    detached: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      console.log(`\x1b[34m[SERVER]\x1b[0m ${line}`);
    }
  });

  serverProcess.stderr.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      console.error(`\x1b[31m[SERVER ERROR]\x1b[0m ${line}`);
    }
  });

  // 4. Wait for backend to successfully listen & respond
  try {
    await waitForHttp(`http://localhost:${serverPort}/api/topics`, 25000);
    console.log(`\x1b[32m[DEV] Server Backend berhasil aktif di http://localhost:${serverPort}\x1b[0m`);
  } catch (err) {
    console.error(`\x1b[31m[DEV ERROR] Gagal menghubungkan ke Backend di port ${serverPort}: ${err.message}\x1b[0m`);
    cleanup();
    process.exit(1);
  }

  // 5. Determine frontend port dynamically
  const initialClientPort = Number(process.env.CLIENT_PORT) || 5173;
  const clientPort = await findAvailablePort(initialClientPort, 'frontend');

  const clientEnv = {
    ...parseEnvFile(path.join(CLIENT_DIR, '.env')),
    ...process.env,
    VITE_API_URL: `http://localhost:${serverPort}`,
  };

  console.log(`[DEV] Memulai Server Frontend di port ${clientPort} (terhubung ke backend di http://localhost:${serverPort})...`);

  // 6. Spawn Frontend Server (Vite)
  clientProcess = spawn('npm', ['run', 'dev', '--prefix', 'client', '--', '--port', String(clientPort), '--strictPort'], {
    cwd: ROOT_DIR,
    env: clientEnv,
    detached: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  clientProcess.stdout.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      console.log(`\x1b[35m[CLIENT]\x1b[0m ${line}`);
    }
  });

  clientProcess.stderr.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      console.error(`\x1b[31m[CLIENT ERROR]\x1b[0m ${line}`);
    }
  });

  // 7. Wait for frontend to respond
  try {
    await waitForHttp(`http://localhost:${clientPort}`, 20000);
  } catch {
    // Vite might serve quickly without waiting
  }

  console.log(`
\x1b[1m\x1b[32m=================================================================\x1b[0m
\x1b[1m\x1b[36mInformaticQuiz siap untuk testing manual:\x1b[0m
- \x1b[33mFrontend Web App\x1b[0m : \x1b[4mhttp://localhost:${clientPort}\x1b[0m
- \x1b[33mBackend REST API\x1b[0m : \x1b[4mhttp://localhost:${serverPort}\x1b[0m

\x1b[1mAkun Guru Demo (untuk Dashboard Admin):\x1b[0m
- Login URL       : \x1b[4mhttp://localhost:${clientPort}/admin/login\x1b[0m
- Username        : \x1b[32mguru\x1b[0m
- Password        : \x1b[32mguru123\x1b[0m
- Registration Key: \x1b[32msekolah-bisa\x1b[0m (jika ingin daftar guru baru)

\x1b[90mTekan Ctrl+C untuk menghentikan kedua server secara bersamaan.\x1b[0m
\x1b[1m\x1b[32m=================================================================\x1b[0m
`);
}

main().catch((err) => {
  console.error('[DEV ERROR]', err);
  process.exit(1);
});
