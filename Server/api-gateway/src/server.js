require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimit } = require('express-rate-limit');
const crypto = require('crypto');

const app = express();

// Flexible CORS for frontend dev servers
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser or localhost requests
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const allowed = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

app.use(rateLimit({
  windowMs: 60000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get('/health', (req, res) => res.json({ success: true, service: 'api-gateway', status: 'ok' }));

function toUpstreamPath(url) {
  if (url.startsWith('/api/v1')) return url;
  return '/api/v1' + (url.startsWith('/') ? url : '/' + url);
}

function proxyTo(targetUrl) {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (p, req) => toUpstreamPath(req.originalUrl),
    on: {
      proxyReq(proxyReq, req) {
        proxyReq.setHeader('X-Request-ID', req.requestId || 'unknown');
      }
    }
  });
}

const REGISTRATION_URL = process.env.REGISTRATION_SERVICE_URL || 'http://localhost:3004';
app.use(['/api/v1/events/:id/registrations', '/events/:id/registrations'], proxyTo(REGISTRATION_URL));

const serviceRoutes = [
  { paths: ['/api/v1/auth', '/auth'], env: 'AUTH_SERVICE_URL', fallback: 'http://localhost:3001' },
  { paths: ['/api/v1/users', '/users'], env: 'USER_SERVICE_URL', fallback: 'http://localhost:3002' },
  { paths: ['/api/v1/events', '/events'], env: 'EVENT_SERVICE_URL', fallback: 'http://localhost:3003' },
  { paths: ['/api/v1/registrations', '/registrations'], env: 'REGISTRATION_SERVICE_URL', fallback: 'http://localhost:3004' },
  { paths: ['/api/v1/clubs', '/clubs'], env: 'CLUB_SERVICE_URL', fallback: 'http://localhost:3005' },
  { paths: ['/api/v1/categories', '/categories'], env: 'CLUB_SERVICE_URL', fallback: 'http://localhost:3005' },
  { paths: ['/api/v1/announcements', '/announcements'], env: 'ANNOUNCEMENT_SERVICE_URL', fallback: 'http://localhost:3007' },
  { paths: ['/api/v1/notifications', '/notifications'], env: 'NOTIFICATION_SERVICE_URL', fallback: 'http://localhost:3006' }
];

for (const route of serviceRoutes) {
  const target = process.env[route.env] || route.fallback;
  app.use(route.paths, proxyTo(target));
}

app.use((req, res) => res.status(404).json({
  success: false,
  error: { code: 'NOT_FOUND', message: 'Gateway route not found', details: req.originalUrl },
  request_id: req.requestId
}));

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`API Gateway listening on ${PORT}`));
