const express = require('express');
const path = require('path');
const multer = require('multer');
const Project = require('../models/Project');
const requireAdmin = require('../middleware/requireAdmin');
const { destroyResource, uploadBuffer } = require('../config/cloudinary');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const types = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };
    if (types[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase())) return callback(null, true);
    const error = new Error('Project image must be a JPG, PNG, or WEBP file.'); error.statusCode = 400; return callback(error);
  },
});
const publicFilter = { $or: [{ publicationStatus: 'published' }, { publicationStatus: { $exists: false } }] };
const parseTechnologies = (value) => (Array.isArray(value) ? value : String(value || '').split(',')).map((item) => item.trim()).filter(Boolean);
const parseBoolean = (value) => value === true || value === 'true';
const uploadImage = (file) => uploadBuffer(file.buffer, { folder: 'portfolio/projects', resource_type: 'image', use_filename: true, unique_filename: true });

router.get('/', async (req, res, next) => {
  try {
    const filter = { ...publicFilter }; if (req.query.category && req.query.category !== 'all') filter.category = req.query.category;
    const projects = await Project.find(filter).sort({ displayOrder: 1, order: 1, createdAt: -1 });
    res.json({ success: true, data: projects, count: projects.length });
  } catch (err) { next(err); }
});
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...publicFilter });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) { next(err); }
});
router.get('/admin/all', requireAdmin, async (_req, res, next) => {
  try { const projects = await Project.find().sort({ displayOrder: 1, order: 1, createdAt: -1 }); res.json({ success: true, data: projects, count: projects.length }); } catch (err) { next(err); }
});

router.post('/', requireAdmin, upload.single('image'), async (req, res, next) => {
  let uploadedImage;
  try {
    if (!req.body.title || !req.body.description) return res.status(400).json({ success: false, message: 'Project title and short description are required.' });
    if (req.file) uploadedImage = await uploadImage(req.file);
    const project = await Project.create({
      title: req.body.title, description: req.body.description, techStack: parseTechnologies(req.body.techStack), liveUrl: req.body.liveUrl || '', githubUrl: req.body.githubUrl || '',
      image: uploadedImage?.secure_url || '', imagePublicId: uploadedImage?.public_id || '', category: req.body.category || 'full-stack', publicationStatus: req.body.publicationStatus === 'draft' ? 'draft' : 'published',
      featured: parseBoolean(req.body.featured), displayOrder: Number(req.body.displayOrder) || 0, order: Number(req.body.displayOrder) || 0, keyFeatures: parseTechnologies(req.body.keyFeatures), whatILearned: req.body.fullDescription || '',
    });
    res.status(201).json({ success: true, data: project, message: 'Project created successfully.' });
  } catch (err) {
    if (uploadedImage?.public_id) try { await destroyResource(uploadedImage.public_id); } catch (cleanupError) { console.error('Unable to clean up failed project upload:', cleanupError.message); }
    next(err);
  }
});

router.put('/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  let projectSaved = false; let uploadedImage;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (!req.body.title || !req.body.description) return res.status(400).json({ success: false, message: 'Project title and short description are required.' });
    if (req.file) uploadedImage = await uploadImage(req.file);
    const oldImagePublicId = project.imagePublicId;
    Object.assign(project, {
      title: req.body.title, description: req.body.description, techStack: parseTechnologies(req.body.techStack), liveUrl: req.body.liveUrl || '', githubUrl: req.body.githubUrl || '',
      category: req.body.category || 'full-stack', publicationStatus: req.body.publicationStatus === 'draft' ? 'draft' : 'published', featured: parseBoolean(req.body.featured),
      displayOrder: Number(req.body.displayOrder) || 0, order: Number(req.body.displayOrder) || 0, keyFeatures: parseTechnologies(req.body.keyFeatures), whatILearned: req.body.fullDescription || '',
    });
    if (uploadedImage) Object.assign(project, { image: uploadedImage.secure_url, imagePublicId: uploadedImage.public_id });
    await project.save(); projectSaved = true;
    if (uploadedImage && oldImagePublicId) try { await destroyResource(oldImagePublicId); } catch (unlinkError) { console.error('Unable to remove replaced project image:', unlinkError.message); }
    res.json({ success: true, data: project, message: 'Project updated successfully.' });
  } catch (err) {
    if (!projectSaved && uploadedImage?.public_id) try { await destroyResource(uploadedImage.public_id); } catch (cleanupError) { console.error('Unable to clean up failed project upload:', cleanupError.message); }
    next(err);
  }
});
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id); if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (req.body.publicationStatus) project.publicationStatus = req.body.publicationStatus === 'draft' ? 'draft' : 'published';
    if (typeof req.body.featured !== 'undefined') project.featured = parseBoolean(req.body.featured);
    await project.save(); res.json({ success: true, data: project, message: 'Project status updated successfully.' });
  } catch (err) { next(err); }
});
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id); if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    await Project.findByIdAndDelete(req.params.id);
    if (project.imagePublicId) try { await destroyResource(project.imagePublicId); } catch (unlinkError) { console.error('Unable to remove project image:', unlinkError.message); }
    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) { next(err); }
});
module.exports = router;
