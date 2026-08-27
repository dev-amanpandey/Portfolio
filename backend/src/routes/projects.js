const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Project = require('../models/Project');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '../../uploads/projects');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    };
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes[file.mimetype]?.includes(extension)) return callback(null, true);
    const error = new Error('Project image must be a JPG, PNG, or WEBP file.');
    error.statusCode = 400;
    return callback(error);
  },
});

const publicFilter = { $or: [{ publicationStatus: 'published' }, { publicationStatus: { $exists: false } }] };
const parseTechnologies = (value) => (Array.isArray(value) ? value : String(value || '').split(',')).map((item) => item.trim()).filter(Boolean);
const parseBoolean = (value) => value === true || value === 'true';
const removeLocalImage = (image) => {
  if (!image || !image.startsWith('/uploads/projects/')) return;
  const imagePath = path.join(uploadDirectory, path.basename(image));
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
};

// GET /api/projects - public, published projects only. Missing status keeps legacy records visible.
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { ...publicFilter };
    if (category && category !== 'all') filter.category = category;
    const projects = await Project.find(filter).sort({ displayOrder: 1, order: 1, createdAt: -1 });
    res.json({ success: true, data: projects, count: projects.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id - public, published projects only.
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...publicFilter });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/admin/all - admin only, including drafts.
router.get('/admin/all', requireAdmin, async (_req, res, next) => {
  try {
    const projects = await Project.find().sort({ displayOrder: 1, order: 1, createdAt: -1 });
    res.json({ success: true, data: projects, count: projects.length });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.body.title || !req.body.description) {
      if (req.file) removeLocalImage(`/uploads/projects/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'Project title and short description are required.' });
    }
    const project = await Project.create({
      title: req.body.title,
      description: req.body.description,
      techStack: parseTechnologies(req.body.techStack),
      liveUrl: req.body.liveUrl || '',
      githubUrl: req.body.githubUrl || '',
      image: req.file ? `/uploads/projects/${req.file.filename}` : '',
      category: req.body.category || 'full-stack',
      publicationStatus: req.body.publicationStatus === 'draft' ? 'draft' : 'published',
      featured: parseBoolean(req.body.featured),
      displayOrder: Number(req.body.displayOrder) || 0,
      order: Number(req.body.displayOrder) || 0,
      keyFeatures: parseTechnologies(req.body.keyFeatures),
      whatILearned: req.body.fullDescription || '',
    });
    res.status(201).json({ success: true, data: project, message: 'Project created successfully.' });
  } catch (err) {
    if (req.file) removeLocalImage(`/uploads/projects/${req.file.filename}`);
    next(err);
  }
});

router.put('/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  let projectSaved = false;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      if (req.file) removeLocalImage(`/uploads/projects/${req.file.filename}`);
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!req.body.title || !req.body.description) {
      if (req.file) removeLocalImage(`/uploads/projects/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'Project title and short description are required.' });
    }

    const oldImage = project.image;
    project.title = req.body.title;
    project.description = req.body.description;
    project.techStack = parseTechnologies(req.body.techStack);
    project.liveUrl = req.body.liveUrl || '';
    project.githubUrl = req.body.githubUrl || '';
    project.category = req.body.category || 'full-stack';
    project.publicationStatus = req.body.publicationStatus === 'draft' ? 'draft' : 'published';
    project.featured = parseBoolean(req.body.featured);
    project.displayOrder = Number(req.body.displayOrder) || 0;
    project.order = Number(req.body.displayOrder) || 0;
    project.keyFeatures = parseTechnologies(req.body.keyFeatures);
    project.whatILearned = req.body.fullDescription || '';
    if (req.file) project.image = `/uploads/projects/${req.file.filename}`;

    await project.save();
    projectSaved = true;
    if (req.file) {
      try { removeLocalImage(oldImage); } catch (unlinkError) { console.error('Unable to remove replaced project image:', unlinkError.message); }
    }
    res.json({ success: true, data: project, message: 'Project updated successfully.' });
  } catch (err) {
    if (!projectSaved && req.file) removeLocalImage(`/uploads/projects/${req.file.filename}`);
    next(err);
  }
});

router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (req.body.publicationStatus) project.publicationStatus = req.body.publicationStatus === 'draft' ? 'draft' : 'published';
    if (typeof req.body.featured !== 'undefined') project.featured = parseBoolean(req.body.featured);
    await project.save();
    res.json({ success: true, data: project, message: 'Project status updated successfully.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    await Project.findByIdAndDelete(req.params.id);
    try { removeLocalImage(project.image); } catch (unlinkError) { console.error('Unable to remove project image:', unlinkError.message); }
    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
