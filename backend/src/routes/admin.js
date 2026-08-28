const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SAME_SITE === 'none',
  sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax'),
};

// POST /api/admin/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('authToken', token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.json({ success: true, message: 'Login successful', user: { email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
    res.clearCookie('authToken', cookieOptions);
  res.json({ success: true, message: 'Logout successful' });
});

// GET /api/admin/me
router.get('/me', requireAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.admin.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
