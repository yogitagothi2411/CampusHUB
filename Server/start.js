const { spawn, execSync } = require('child_process');
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

function killChild(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F 2>nul`);
    } else {
      proc.kill('SIGTERM');
    }
  } catch (e) {
    // ignore
  }
}

function shutdown() {
  console.log('\n[manager] Shutting down all services...');
  for (const child of children) {
    killChild(child.proc);
  }
  freePorts();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function startService(svc) {
  const serviceDir = path.resolve(__dirname, svc.dir);
  const scriptPath = path.join(serviceDir, 'src', 'server.js');

  const proc = spawn(process.execPath, [scriptPath], {
    cwd: serviceDir,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const l of lines) {
      if (l) console.log(`[${svc.name}] ${l}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const l of lines) {
      if (l) console.error(`[${svc.name} ERROR] ${l}`);
    }
  });

  proc.on('exit', (code, signal) => {
    console.log(`[${svc.name}] exited with code ${code} (${signal || 'normal'})`);
  });

  children.push({ ...svc, proc });
  return proc;
}

async function ping(port, path = '/health', timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path, timeout }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, body });
        }
      });
    });
    req.on('error', () => resolve({ ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
  });
}

async function waitForAll(maxWaitMs = 15000) {
  const startTime = Date.now();
  console.log('[manager] Waiting for all services to become healthy...');
  
  while (Date.now() - startTime < maxWaitMs) {
    const results = await Promise.all(SERVICES.map(s => ping(s.port, '/health')));
    const allHealthy = results.every(r => r.ok);
    if (allHealthy) {
      console.log('[manager] All 8 services are UP and HEALTHY!');
      SERVICES.forEach((s, i) => {
        console.log(`  ✓ ${s.name.padEnd(24)} on http://localhost:${s.port}/health -> status: ${results[i].status}`);
      });
      return true;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.error('[manager] Timeout waiting for all services to become healthy.');
  return false;
}

async function main() {
  freePorts();
  console.log('====================================================');
  console.log(' Starting CampusHUB Microservices & API Gateway');
  console.log('====================================================');

  for (const svc of SERVICES) {
    startService(svc);
  }

  const isCheckMode = process.argv.includes('--check');
  const healthy = await waitForAll();

  if (!healthy) {
    console.error('[manager] Not all services could start successfully.');
    if (isCheckMode) {
      shutdown();
      process.exit(1);
    }
    return;
  }

  if (isCheckMode) {
    console.log('[manager] Check mode complete, shutting down gracefully.');
    shutdown();
  } else {
    console.log('\n[manager] Server running. API Gateway listening at http://localhost:3000');
    console.log('[manager] Press Ctrl+C to stop all services.\n');
  }
}

main();
