const express   = require('express');
const router    = express.Router();
const BlogPost  = require('../models/BlogPost');

// GET /api/blog
router.get('/', async (req, res, next) => {
  try {
    const posts = await BlogPost.find({ published: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: posts, count: posts.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/blog/:id
router.get('/:id', async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
