const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Certificate = require('../models/Certificate');
const requireAdmin = require('../middleware/requireAdmin');

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
    const allowedTypes = {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    };
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes[file.mimetype]?.includes(extension)) return callback(null, true);
    const error = new Error('Certificate file must be a PDF, JPG, JPEG, PNG, or WEBP file.');
    error.statusCode = 400;
    return callback(error);
  },
});

// GET /api/certificates - Public endpoint
router.get('/', async (_req, res, next) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 });
    res.json({ success: true, data: certificates, count: certificates.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/certificates - Admin only
router.post('/', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or image certificate.' });
    }
    if (!req.body.title || !req.body.issuer) {
      // Clean up orphaned file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Certificate title and issuer are required.' });
    }

    const certificate = await Certificate.create({
      title: req.body.title,
      issuer: req.body.issuer,
      issuedOn: req.body.issuedOn || '',
      credentialId: req.body.credentialId || '',
      fileUrl: `/uploads/certificates/${req.file.filename}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.status(201).json({ success: true, data: certificate, message: 'Certificate uploaded successfully.' });
  } catch (err) {
    // Clean up orphaned file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
});

// PUT /api/certificates/:id - Admin only. A replacement file is optional.
router.put('/:id', requireAdmin, upload.single('file'), async (req, res, next) => {
  let certificateSaved = false;
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (!req.body.title || !req.body.issuer) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Certificate title and issuer are required.' });
    }

    const previousFilePath = path.join(uploadDirectory, path.basename(certificate.fileUrl));
    certificate.title = req.body.title;
    certificate.issuer = req.body.issuer;
    certificate.issuedOn = req.body.issuedOn || '';
    certificate.credentialId = req.body.credentialId || '';

    if (req.file) {
      certificate.fileUrl = `/uploads/certificates/${req.file.filename}`;
      certificate.fileName = req.file.originalname;
      certificate.mimeType = req.file.mimetype;
    }

    await certificate.save();
    certificateSaved = true;
    if (req.file && fs.existsSync(previousFilePath)) {
      try {
        fs.unlinkSync(previousFilePath);
      } catch (unlinkError) {
        console.error('Unable to remove replaced certificate file:', unlinkError.message);
      }
    }

    res.json({ success: true, data: certificate, message: 'Certificate updated successfully.' });
  } catch (err) {
    if (!certificateSaved && req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});

// PATCH /api/certificates/:id - Admin only, metadata-only update.
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    if (typeof req.body.title !== 'undefined') certificate.title = req.body.title;
    if (typeof req.body.issuer !== 'undefined') certificate.issuer = req.body.issuer;
    if (typeof req.body.issuedOn !== 'undefined') certificate.issuedOn = req.body.issuedOn;
    if (typeof req.body.credentialId !== 'undefined') certificate.credentialId = req.body.credentialId;
    if (!certificate.title || !certificate.issuer) {
      return res.status(400).json({ success: false, message: 'Certificate title and issuer are required.' });
    }
    await certificate.save();
    res.json({ success: true, data: certificate, message: 'Certificate updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/certificates/:id - Admin only
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    // Extract filename from fileUrl
    const fileUrl = certificate.fileUrl;
    const filename = fileUrl.split('/').pop();
    const filePath = path.join(uploadDirectory, filename);

    // Delete file from disk if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete certificate from database
    await Certificate.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Certificate deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
