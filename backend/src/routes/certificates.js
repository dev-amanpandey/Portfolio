const express = require('express');
const path = require('path');
const multer = require('multer');
const Certificate = require('../models/Certificate');
const requireAdmin = require('../middleware/requireAdmin');
const { destroyResource, uploadBuffer } = require('../config/cloudinary');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, callback) => {
  const types = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };
  if (types[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase())) return callback(null, true);
  const error = new Error('Certificate file must be a PDF, JPG, JPEG, PNG, or WEBP file.'); error.statusCode = 400; return callback(error);
} });
const uploadCertificateFile = (file) => uploadBuffer(file.buffer, { folder: 'portfolio/certificates', resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image', use_filename: true, unique_filename: true });

router.get('/', async (_req, res, next) => { try { const certificates = await Certificate.find().sort({ createdAt: -1 }); res.json({ success: true, data: certificates, count: certificates.length }); } catch (err) { next(err); } });
router.post('/', requireAdmin, upload.single('file'), async (req, res, next) => {
  let uploadedFile;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a PDF or image certificate.' });
    if (!req.body.title || !req.body.issuer) return res.status(400).json({ success: false, message: 'Certificate title and issuer are required.' });
    uploadedFile = await uploadCertificateFile(req.file);
    const certificate = await Certificate.create({ title: req.body.title, issuer: req.body.issuer, issuedOn: req.body.issuedOn || '', credentialId: req.body.credentialId || '', fileUrl: uploadedFile.secure_url, fileName: req.file.originalname, mimeType: req.file.mimetype, filePublicId: uploadedFile.public_id });
    res.status(201).json({ success: true, data: certificate, message: 'Certificate uploaded successfully.' });
  } catch (err) {
    if (uploadedFile?.public_id) try { await destroyResource(uploadedFile.public_id, req.file?.mimetype === 'application/pdf' ? 'raw' : 'image'); } catch (cleanupError) { console.error('Unable to clean up failed certificate upload:', cleanupError.message); }
    next(err);
  }
});
router.put('/:id', requireAdmin, upload.single('file'), async (req, res, next) => {
  let saved = false; let uploadedFile;
  try {
    const certificate = await Certificate.findById(req.params.id); if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    if (!req.body.title || !req.body.issuer) return res.status(400).json({ success: false, message: 'Certificate title and issuer are required.' });
    if (req.file) uploadedFile = await uploadCertificateFile(req.file);
    const oldPublicId = certificate.filePublicId; const oldResourceType = certificate.mimeType === 'application/pdf' ? 'raw' : 'image';
    Object.assign(certificate, { title: req.body.title, issuer: req.body.issuer, issuedOn: req.body.issuedOn || '', credentialId: req.body.credentialId || '' });
    if (uploadedFile) Object.assign(certificate, { fileUrl: uploadedFile.secure_url, fileName: req.file.originalname, mimeType: req.file.mimetype, filePublicId: uploadedFile.public_id });
    await certificate.save(); saved = true;
    if (uploadedFile && oldPublicId) try { await destroyResource(oldPublicId, oldResourceType); } catch (unlinkError) { console.error('Unable to remove replaced certificate file:', unlinkError.message); }
    res.json({ success: true, data: certificate, message: 'Certificate updated successfully.' });
  } catch (err) {
    if (!saved && uploadedFile?.public_id) try { await destroyResource(uploadedFile.public_id, req.file?.mimetype === 'application/pdf' ? 'raw' : 'image'); } catch (cleanupError) { console.error('Unable to clean up failed certificate upload:', cleanupError.message); }
    next(err);
  }
});
router.patch('/:id', requireAdmin, async (req, res, next) => { try {
  const certificate = await Certificate.findById(req.params.id); if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found.' });
  if (typeof req.body.title !== 'undefined') certificate.title = req.body.title; if (typeof req.body.issuer !== 'undefined') certificate.issuer = req.body.issuer; if (typeof req.body.issuedOn !== 'undefined') certificate.issuedOn = req.body.issuedOn; if (typeof req.body.credentialId !== 'undefined') certificate.credentialId = req.body.credentialId;
  if (!certificate.title || !certificate.issuer) return res.status(400).json({ success: false, message: 'Certificate title and issuer are required.' });
  await certificate.save(); res.json({ success: true, data: certificate, message: 'Certificate updated successfully.' });
} catch (err) { next(err); } });
router.delete('/:id', requireAdmin, async (req, res, next) => { try {
  const certificate = await Certificate.findById(req.params.id); if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found.' });
  await Certificate.findByIdAndDelete(req.params.id);
  if (certificate.filePublicId) try { await destroyResource(certificate.filePublicId, certificate.mimeType === 'application/pdf' ? 'raw' : 'image'); } catch (unlinkError) { console.error('Unable to remove certificate file:', unlinkError.message); }
  res.json({ success: true, message: 'Certificate deleted successfully.' });
} catch (err) { next(err); } });
module.exports = router;
