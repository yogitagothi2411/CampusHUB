const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, json: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, json: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('\n======================================================');
  console.log(' CampusHUB Microservices & API Gateway Verification');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  // 1. Direct Service Health Checks
  console.log('1. Checking Direct Service Health Checks:');
  const services = [
    { name: 'API Gateway', port: 3000 },
    { name: 'Auth Service', port: 3001 },
    { name: 'User Service', port: 3002 },
    { name: 'Event Service', port: 3003 },
    { name: 'Registration Service', port: 3004 },
    { name: 'Club Service', port: 3005 },
    { name: 'Notification Service', port: 3006 },
    { name: 'Announcement Service', port: 3007 }
  ];

  for (const s of services) {
    try {
      const res = await request({ hostname: '127.0.0.1', port: s.port, path: '/health', method: 'GET' });
      assert(res.status === 200 && res.json && res.json.status === 'ok', `${s.name} (: ${s.port}) /health returns 200 OK`);
    } catch (e) {
      assert(false, `${s.name} (: ${s.port}) /health reachable`, e.message);
    }
  }

  // 2. Gateway Proxied Endpoints (both /api/v1/ and frontend / style)
  console.log('\n2. Checking API Gateway Proxied Endpoints:');

  try {
    const gwHealth = await request({ hostname: '127.0.0.1', port: 3000, path: '/health', method: 'GET' });
    assert(gwHealth.status === 200 && gwHealth.json?.status === 'ok', 'Gateway /health is 200 OK');
  } catch (e) {
    assert(false, 'Gateway /health reachable', e.message);
  }

  // Frontend style: GET /clubs
  try {
    const clubs = await request({ hostname: '127.0.0.1', port: 3000, path: '/clubs', method: 'GET' });
    assert(clubs.status === 200 && Array.isArray(clubs.json?.data), `Gateway GET /clubs returned ${clubs.json?.data?.length || 0} clubs`);
  } catch (e) {
    assert(false, 'Gateway GET /clubs reachable', e.message);
  }

  // Frontend style: GET /categories
  try {
    const cats = await request({ hostname: '127.0.0.1', port: 3000, path: '/categories', method: 'GET' });
    assert(cats.status === 200 && Array.isArray(cats.json?.data), `Gateway GET /categories returned ${cats.json?.data?.length || 0} categories`);
  } catch (e) {
    assert(false, 'Gateway GET /categories reachable', e.message);
  }

  // Frontend style: GET /events
  try {
    const events = await request({ hostname: '127.0.0.1', port: 3000, path: '/events', method: 'GET' });
    assert(events.status === 200 && Array.isArray(events.json?.data), `Gateway GET /events returned ${events.json?.data?.length || 0} events`);
  } catch (e) {
    assert(false, 'Gateway GET /events reachable', e.message);
  }

  // Frontend style: GET /announcements
  try {
    const anns = await request({ hostname: '127.0.0.1', port: 3000, path: '/announcements', method: 'GET' });
    assert(anns.status === 200 && Array.isArray(anns.json?.data), `Gateway GET /announcements returned ${anns.json?.data?.length || 0} announcements`);
  } catch (e) {
    assert(false, 'Gateway GET /announcements reachable', e.message);
  }

  // 3. Frontend Authentication Format (form-urlencoded with 'username')
  console.log('\n3. Checking Frontend Authentication Format:');
  let token = null;

  try {
    const formParams = new URLSearchParams({ username: 'student@iiitvadodara.ac.in', password: 'student123' }).toString();
    const loginRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formParams)
      }
    }, formParams);

    const hasAccessToken = !!(loginRes.json?.access_token || loginRes.json?.data?.access_token);
    assert(loginRes.status === 200 && hasAccessToken, 'Gateway POST /auth/login succeeds with form-urlencoded username/password');
    token = loginRes.json?.access_token || loginRes.json?.data?.access_token;
  } catch (e) {
    assert(false, 'Gateway POST /auth/login succeeds', e.message);
  }

  if (token) {
    const authHeaders = {
      'Authorization': `Bearer ${token}`
    };

    // Frontend style: GET /auth/me
    try {
      const meRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/auth/me', method: 'GET', headers: authHeaders });
      const email = meRes.json?.email || meRes.json?.data?.email;
      assert(meRes.status === 200 && email === 'student@iiitvadodara.ac.in', 'Gateway GET /auth/me returned correct user profile');
    } catch (e) {
      assert(false, 'Gateway GET /auth/me reachable', e.message);
    }

    // Frontend style: GET /users/me
    try {
      const userMe = await request({ hostname: '127.0.0.1', port: 3000, path: '/users/me', method: 'GET', headers: authHeaders });
      assert(userMe.status === 200, 'Gateway GET /users/me returned 200 OK');
    } catch (e) {
      assert(false, 'Gateway GET /users/me reachable', e.message);
    }

    // Frontend style: GET /notifications/me
    try {
      const notifs = await request({ hostname: '127.0.0.1', port: 3000, path: '/notifications/me', method: 'GET', headers: authHeaders });
      assert(notifs.status === 200 && Array.isArray(notifs.json?.data), 'Gateway GET /notifications/me returned user notifications list');
    } catch (e) {
      assert(false, 'Gateway GET /notifications/me reachable', e.message);
    }

    // Frontend style: GET /registrations/me
    try {
      const regs = await request({ hostname: '127.0.0.1', port: 3000, path: '/registrations/me', method: 'GET', headers: authHeaders });
      assert(regs.status === 200 && Array.isArray(regs.json?.data), 'Gateway GET /registrations/me returned user registrations list');
    } catch (e) {
      assert(false, 'Gateway GET /registrations/me reachable', e.message);
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
