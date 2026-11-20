const { spawn, execSync, fork } = require('child_process');
const path = require('path');
const http = require('http');

const SERVICES = [
  { name: 'auth-service', port: 3001, dir: 'services/auth-service' },
  { name: 'user-service', port: 3002, dir: 'services/user-service' },
  { name: 'event-service', port: 3003, dir: 'services/event-service' },
  { name: 'registration-service', port: 3004, dir: 'services/registration-service' },
  { name: 'club-service', port: 3005, dir: 'services/club-service' },
  { name: 'notification-service', port: 3006, dir: 'services/notification-service' },
  { name: 'announcement-service', port: 3007, dir: 'services/announcement-service' },
  { name: 'api-gateway', port: 3000, dir: 'api-gateway' }
];

const children = [];

function freePorts() {
  if (process.platform === 'win32') {
    try {
      execSync('powershell -Command "Get-NetTCPConnection -LocalPort 3000,3001,3002,3003,3004,3005,3006,3007 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul');
    } catch {}
  }
}

function killAll() {
  console.log('[verifier] Terminating background service processes...');
  for (const child of children) {
    if (child.proc && child.proc.pid) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${child.proc.pid} /T /F 2>nul`);
        } else {
          child.proc.kill('SIGTERM');
        }
      } catch (e) {}
    }
  }
  freePorts();
}

process.on('SIGINT', () => { killAll(); process.exit(1); });
process.on('SIGTERM', () => { killAll(); process.exit(1); });

function startService(svc) {
  const serviceDir = path.resolve(__dirname, svc.dir);
  const scriptPath = path.join(serviceDir, 'src', 'server.js');

  const proc = spawn(process.execPath, [scriptPath], {
    cwd: serviceDir,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stderr.on('data', (d) => {
    console.error(`[${svc.name} STDERR] ${d.toString().trim()}`);
  });

  children.push({ ...svc, proc });
  return proc;
}

async function ping(port) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: '/health', timeout: 1000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  freePorts();
  console.log('>>> [1/3] Starting all 8 microservices & API Gateway...');
  for (const svc of SERVICES) {
    startService(svc);
  }

  // Wait for all to become healthy
  console.log('>>> [2/3] Waiting for all services to become ready...');
  const start = Date.now();
  let allReady = false;

  while (Date.now() - start < 15000) {
    const results = await Promise.all(SERVICES.map(s => ping(s.port)));
    if (results.every(Boolean)) {
      allReady = true;
      break;
    }
    await new Promise(r => setTimeout(r, 400));
  }

  if (!allReady) {
    console.error('[ERROR] Timed out waiting for all services to become ready.');
    killAll();
    process.exit(1);
  }

  console.log('>>> [3/3] All services are online! Running API Gateway integration tests...\n');

  const testProc = fork(path.join(__dirname, 'test-health.js'), [], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  testProc.on('close', (code) => {
    killAll();
    console.log(`\nVerification finished with exit code ${code}.`);
    process.exit(code);
  });
}

main().catch(err => {
  console.error('[FATAL]', err);
  killAll();
  process.exit(1);
});
