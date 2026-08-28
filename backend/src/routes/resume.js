const express = require('express');
const https = require('https');
const path = require('path');
const multer = require('multer');
const Resume = require('../models/Resume');
const requireAdmin = require('../middleware/requireAdmin');
const { destroyResource, uploadBuffer } = require('../config/cloudinary');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, callback) => {
  if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') return callback(null, true);
  const error = new Error('Resume must be a PDF file.'); error.statusCode = 400; return callback(error);
} });
const isPdfFile = (buffer) => buffer?.subarray(0, 5).toString() === '%PDF-';
const uploadResume = (file) => uploadBuffer(file.buffer, { folder: 'portfolio/resume', resource_type: 'raw', use_filename: true, unique_filename: true });
const downloadFileName = (fileName) => {
  const sanitized = String(fileName || 'Resume.pdf')
    .replace(/[\\/]/g, '_')
    .replace(/[\r\n"]/g, '')
    .replace(/[^a-zA-Z0-9._() -]/g, '_')
    .trim() || 'Resume.pdf';
  return sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
};

router.get('/', async (_req, res, next) => { try {
  const resume = await Resume.findOne().sort({ updatedAt: -1 });
  if (!resume) return res.status(404).json({ success: false, message: 'No resume has been uploaded yet.' });
  res.json({ success: true, data: resume });
} catch (err) { next(err); } });
router.get('/admin/current', requireAdmin, async (_req, res, next) => { try { const resume = await Resume.findOne().sort({ updatedAt: -1 }); res.json({ success: true, data: resume || null }); } catch (err) { next(err); } });
// Streams the active Cloudinary PDF through this origin so download filename and MIME type are reliable.
router.get('/download', async (_req, res, next) => {
  try {
    const resume = await Resume.findOne().sort({ updatedAt: -1 });
    if (!resume) return res.status(404).json({ success: false, message: 'No resume has been uploaded yet.' });
    if (!resume.fileUrl || !/^https:\/\//i.test(resume.fileUrl)) {
      const error = new Error('The current resume file is unavailable.'); error.statusCode = 502; throw error;
    }

    const fileName = downloadFileName(resume.fileName);
    const cloudinaryRequest = https.get(resume.fileUrl, (cloudinaryResponse) => {
      if (cloudinaryResponse.statusCode !== 200) {
        cloudinaryResponse.resume();
        const error = new Error('The resume file could not be retrieved from Cloudinary.'); error.statusCode = 502;
        return next(error);
      }
      // Cloudinary raw resources may be served as application/octet-stream even when the
      // original upload is a PDF. The upload route validates the PDF signature already.
      const contentType = String(cloudinaryResponse.headers['content-type'] || '').toLowerCase();
      const acceptedContentTypes = ['application/pdf', 'application/octet-stream', 'binary/octet-stream', 'application/x-pdf'];
      if (!acceptedContentTypes.some((type) => contentType.includes(type))) {
        cloudinaryResponse.resume();
        const error = new Error('The current resume file is not a valid PDF response.'); error.statusCode = 502;
        return next(error);
      }
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-store',
      });
      cloudinaryResponse.pipe(res);
    });
    cloudinaryRequest.setTimeout(30000, () => cloudinaryRequest.destroy(new Error('Cloudinary download timed out.')));
    cloudinaryRequest.on('error', (error) => { error.statusCode = 502; next(error); });
  } catch (err) { next(err); }
});
router.post('/', requireAdmin, upload.single('resume'), async (req, res, next) => {
  let saved = false; let uploadedFile;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please choose a resume PDF to upload.' });
    if (!isPdfFile(req.file.buffer)) return res.status(400).json({ success: false, message: 'The uploaded file is not a valid PDF.' });
    uploadedFile = await uploadResume(req.file);
    const previousResume = await Resume.findOne().sort({ updatedAt: -1 });
    const resume = previousResume || new Resume(); const previousPublicId = resume.filePublicId;
    Object.assign(resume, { fileUrl: uploadedFile.secure_url, filePublicId: uploadedFile.public_id, fileName: req.file.originalname, fileSize: req.file.size, mimeType: req.file.mimetype });
    await resume.save(); saved = true;
    if (previousPublicId) try { await destroyResource(previousPublicId, 'raw'); } catch (unlinkError) { console.error('Unable to remove replaced resume:', unlinkError.message); }
    await Resume.deleteMany({ _id: { $ne: resume._id } });
    res.status(previousResume ? 200 : 201).json({ success: true, data: resume, message: previousResume ? 'Resume replaced successfully.' : 'Resume uploaded successfully.' });
  } catch (err) {
    if (!saved && uploadedFile?.public_id) try { await destroyResource(uploadedFile.public_id, 'raw'); } catch (cleanupError) { console.error('Unable to clean up failed resume upload:', cleanupError.message); }
    next(err);
  }
});
router.delete('/', requireAdmin, async (_req, res, next) => { try {
  const resume = await Resume.findOne().sort({ updatedAt: -1 }); if (!resume) return res.status(404).json({ success: false, message: 'No resume has been uploaded yet.' });
  await Resume.deleteMany({});
  if (resume.filePublicId) try { await destroyResource(resume.filePublicId, 'raw'); } catch (unlinkError) { console.error('Unable to remove resume:', unlinkError.message); }
  res.json({ success: true, message: 'Resume deleted successfully.' });
} catch (err) { next(err); } });
module.exports = router;
