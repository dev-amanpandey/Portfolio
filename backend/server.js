const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: `${__dirname}/.env` });

const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio';
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
if (process.env.NODE_ENV !== 'production' && !allowedOrigins.includes('http://localhost:5173')) {
  allowedOrigins.push('http://localhost:5173');
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
// Kept for legacy database records that still reference /uploads paths. New uploads use Cloudinary.
app.use('/uploads', express.static(`${__dirname}/uploads`));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok', message: 'Portfolio API is running.' });
});

app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/projects', require('./src/routes/projects'));
app.use('/api/blog', require('./src/routes/blog'));
app.use('/api/certificates', require('./src/routes/certificates'));
app.use('/api/resume', require('./src/routes/resume'));
app.use('/api/profile-images', require('./src/routes/profileImages'));
app.use('/api/contact', require('./src/routes/contact'));
app.use(errorHandler);

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => console.log(`Portfolio API running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
