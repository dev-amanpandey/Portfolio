const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Certificate = require('../models/Certificate');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '../../uploads/certificates');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    callback(null, allowedTypes.includes(file.mimetype));
  },
});

router.get('/', async (_req, res, next) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 });
    res.json({ success: true, data: certificates, count: certificates.length });
  } catch (err) {
    next(err);
  }
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or image certificate.' });
    }
    if (!req.body.title || !req.body.issuer) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Certificate title and issuer are required.' });
    }

    const certificate = await Certificate.create({
      title: req.body.title,
      issuer: req.body.issuer,
      issuedOn: req.body.issuedOn || '',
      fileUrl: `/uploads/certificates/${req.file.filename}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.status(201).json({ success: true, data: certificate, message: 'Certificate uploaded successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
