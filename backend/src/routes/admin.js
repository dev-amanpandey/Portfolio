const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const User = require('../models/User');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SAME_SITE === 'none',
  sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax'),
};

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const forgotPasswordMessage = 'If an admin account exists for that email, a password reset link has been sent.';

router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: forgotPasswordMessage });

    const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
    const frontendUrl = (process.env.FRONTEND_URL || '').split(',')[0].trim();
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !frontendUrl) {
      return res.status(503).json({ success: false, message: 'Password reset email is not configured yet.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = hashResetToken(resetToken);
    user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/admin/reset-password?token=${resetToken}`;
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [user.email],
      subject: 'Reset your portfolio admin password',
      text: `Reset your password using this link (valid for 15 minutes): ${resetUrl}`,
      html: `<p>We received a request to reset your portfolio admin password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 15 minutes and can only be used once.</p>`,
    });

    if (error) {
      user.resetTokenHash = undefined;
      user.resetTokenExpiresAt = undefined;
      await user.save();
      return res.status(502).json({ success: false, message: 'Unable to send the reset email. Please try again later.' });
    }

    return res.json({ success: true, message: forgotPasswordMessage });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');
    if (!token || password.length < 8) {
      return res.status(400).json({ success: false, message: 'A valid token and password of at least 8 characters are required.' });
    }

    const user = await User.findOne({
      resetTokenHash: hashResetToken(token),
      resetTokenExpiresAt: { $gt: new Date() },
    }).select('+resetTokenHash +resetTokenExpiresAt');

    if (!user) {
      return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired.' });
    }

    user.passwordHash = password;
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

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
