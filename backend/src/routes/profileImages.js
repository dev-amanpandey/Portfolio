const express = require('express');
const path = require('path');
const multer = require('multer');
const ProfileImage = require('../models/ProfileImage');
const requireAdmin = require('../middleware/requireAdmin');
const { destroyResource, uploadBuffer } = require('../config/cloudinary');

const router = express.Router();
const validSlots = new Set(['hero', 'about']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    if (allowedTypes.has(file.mimetype) && allowedExtensions.has(path.extname(file.originalname).toLowerCase())) return callback(null, true);
    const error = new Error('Profile images must be JPG, PNG, or WEBP files.');
    error.statusCode = 400;
    return callback(error);
  },
});

router.get('/', async (_req, res, next) => {
  try {
    const images = await ProfileImage.find().sort({ slot: 1 });
    res.json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/current', requireAdmin, async (_req, res, next) => {
  try {
    const images = await ProfileImage.find().sort({ slot: 1 });
    res.json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
});

router.put('/:slot', requireAdmin, upload.single('image'), async (req, res, next) => {
  let saved = false;
  let uploadedFile;
  try {
    const { slot } = req.params;
    if (!validSlots.has(slot)) return res.status(400).json({ success: false, message: 'Unknown profile image slot.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Please choose an image to upload.' });

    uploadedFile = await uploadBuffer(req.file.buffer, {
      folder: 'portfolio/profile-images',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
    });
    const previousImage = await ProfileImage.findOne({ slot });
    const image = previousImage || new ProfileImage({ slot });
    const previousPublicId = image.filePublicId;
    Object.assign(image, {
      fileUrl: uploadedFile.secure_url,
      filePublicId: uploadedFile.public_id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
    await image.save();
    saved = true;
    if (previousPublicId) {
      try { await destroyResource(previousPublicId); } catch (unlinkError) { console.error('Unable to remove replaced profile image:', unlinkError.message); }
    }
    res.status(previousImage ? 200 : 201).json({ success: true, data: image, message: `${slot === 'hero' ? 'Hero' : 'About'} image replaced successfully.` });
  } catch (err) {
    if (!saved && uploadedFile?.public_id) {
      try { await destroyResource(uploadedFile.public_id); } catch (cleanupError) { console.error('Unable to clean up failed profile image:', cleanupError.message); }
    }
    next(err);
  }
});

router.delete('/:slot', requireAdmin, async (req, res, next) => {
  try {
    const { slot } = req.params;
    if (!validSlots.has(slot)) return res.status(400).json({ success: false, message: 'Unknown profile image slot.' });
    const image = await ProfileImage.findOneAndDelete({ slot });
    if (!image) return res.status(404).json({ success: false, message: 'No image exists in this slot.' });
    if (image.filePublicId) {
      try { await destroyResource(image.filePublicId); } catch (unlinkError) { console.error('Unable to remove profile image:', unlinkError.message); }
    }
    res.json({ success: true, message: `${slot === 'hero' ? 'Hero' : 'About'} image deleted. The local fallback image is active.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;