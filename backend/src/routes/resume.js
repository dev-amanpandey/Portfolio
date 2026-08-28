const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Resume = require('../models/Resume');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '../../uploads/resume');
const maxFileSize = 10 * 1024 * 1024;
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, _file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`),
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'application/pdf' && extension === '.pdf') return callback(null, true);
    const error = new Error('Resume must be a PDF file.');
    error.statusCode = 400;
    return callback(error);
  },
});

const removeStoredResume = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith('/uploads/resume/')) return;
  const filePath = path.join(uploadDirectory, path.basename(fileUrl));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const isPdfFile = (filePath) => {
  const descriptor = fs.openSync(filePath, 'r');
  try {
    const signature = Buffer.alloc(5);
    fs.readSync(descriptor, signature, 0, signature.length, 0);
    return signature.toString() === '%PDF-';
  } finally {
    fs.closeSync(descriptor);
  }
};

// GET /api/resume - public: exposes only the one active resume.
router.get('/', async (_req, res, next) => {
  try {
    const resume = await Resume.findOne().sort({ updatedAt: -1 });
    if (!resume) return res.status(404).json({ success: false, message: 'No resume has been uploaded yet.' });
    res.json({ success: true, data: resume });
  } catch (err) {
    next(err);
  }
});

// GET /api/resume/admin/current - same data, protected for the management panel.
router.get('/admin/current', requireAdmin, async (_req, res, next) => {
  try {
    const resume = await Resume.findOne().sort({ updatedAt: -1 });
    res.json({ success: true, data: resume || null });
  } catch (err) {
    next(err);
  }
});

// POST /api/resume - admin-only upload/replacement.
router.post('/', requireAdmin, upload.single('resume'), async (req, res, next) => {
  let saved = false;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please choose a resume PDF to upload.' });
    if (!isPdfFile(req.file.path)) {
      removeStoredResume(`/uploads/resume/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'The uploaded file is not a valid PDF.' });
    }

    const previousResume = await Resume.findOne().sort({ updatedAt: -1 });
    const resume = previousResume || new Resume();
    const previousFileUrl = resume.fileUrl;
    resume.fileUrl = `/uploads/resume/${req.file.filename}`;
    resume.fileName = req.file.originalname;
    resume.fileSize = req.file.size;
    resume.mimeType = req.file.mimetype;
    await resume.save();
    saved = true;

    if (previousFileUrl && previousFileUrl !== resume.fileUrl) {
      try { removeStoredResume(previousFileUrl); } catch (unlinkError) { console.error('Unable to remove replaced resume:', unlinkError.message); }
    }
    // Clean up accidental legacy duplicates, keeping the newly saved document active.
    await Resume.deleteMany({ _id: { $ne: resume._id } });
    res.status(previousResume ? 200 : 201).json({ success: true, data: resume, message: previousResume ? 'Resume replaced successfully.' : 'Resume uploaded successfully.' });
  } catch (err) {
    if (!saved && req.file) {
      try { removeStoredResume(`/uploads/resume/${req.file.filename}`); } catch (_cleanupError) { /* preserve the original error */ }
    }
    next(err);
  }
});

// DELETE /api/resume - admin-only removal of the active resume.
router.delete('/', requireAdmin, async (_req, res, next) => {
  try {
    const resume = await Resume.findOne().sort({ updatedAt: -1 });
    if (!resume) return res.status(404).json({ success: false, message: 'No resume has been uploaded yet.' });
    removeStoredResume(resume.fileUrl);
    await Resume.deleteMany({});
    res.json({ success: true, message: 'Resume deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
