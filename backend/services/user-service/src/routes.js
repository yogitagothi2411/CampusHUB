const express = require('express');
const auth = require('./middleware/auth');

const router = express.Router();

const AUTH_URL =
  process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Get users from Auth Service
async function getUsersByRole(req, res, next, role) {
  try {
    // Only admins can access the complete user directory
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can access the user directory'
        }
      });
    }

    const params = new URLSearchParams({ role });

    ['search', 'status', 'branch', 'year', 'club_id'].forEach(key => {
      if (req.query[key]) {
        params.set(key, req.query[key]);
      }
    });

    const response = await fetch(
      `${AUTH_URL}/internal/users?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: req.headers.authorization
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: result.error || result
      });
    }

    // Auth Service currently returns a raw array
    const users = Array.isArray(result)
      ? result
      : result.data || [];

    return res.json({
      success: true,
      data: users
    });

  } catch (error) {
    next(error);
  }
}

// Current user profile
router.get('/me', auth, async (req, res, next) => {
  try {
    const response = await fetch(
      `${AUTH_URL}/internal/users/${encodeURIComponent(req.user.sub)}`,
      {
        headers: {
          Authorization: req.headers.authorization
        }
      }
    );

    const result = await response.json();
    return res.status(response.status).json(result);

  } catch (error) {
    next(error);
  }
});

// Students
router.get('/students', auth, (req, res, next) => {
  return getUsersByRole(req, res, next, 'student');
});

// Organizers
router.get('/organizers', auth, (req, res, next) => {
  return getUsersByRole(req, res, next, 'organizer');
});

// Update own profile (admins may update any user)
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const id = req.params.id === 'me' ? req.user.sub : req.params.id;
    const response = await fetch(
      `${AUTH_URL}/internal/users/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.authorization
        },
        body: JSON.stringify(req.body || {})
      }
    );
    const result = await response.json();
    return res.status(response.status).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;