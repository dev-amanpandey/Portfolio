const express = require('express');
const { Resend } = require('resend');
const router  = express.Router();
const Contact = require('../models/Contact');

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// POST /api/contact
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject = '', message } = req.body;

    if (!name || !email || !message)
      return res.status(400).json({ success: false, message: 'Please fill in all fields.' });

    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });

    const { RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_TO_EMAIL } = process.env;
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !RESEND_TO_EMAIL) {
      return res.status(503).json({
        success: false,
        message: 'Email delivery is not configured yet.',
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || 'No subject provided');
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br>');
    const { error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [RESEND_TO_EMAIL],
      replyTo: email,
      subject: `Portfolio message from ${name}${subject ? `: ${subject}` : ''}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || 'No subject provided'}\n\n${message}`,
      html: `<h2>New portfolio message</h2><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Subject:</strong> ${safeSubject}</p><p><strong>Message:</strong><br>${safeMessage}</p>`,
    });

    if (error) {
      return res.status(502).json({ success: false, message: 'Unable to send your message. Please try again later.' });
    }

    const contact = await Contact.create({ name, email, subject, message });
    res.status(201).json({
      success: true,
      message: "Message sent! I'll get back to you soon 🎉",
      data: contact,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
