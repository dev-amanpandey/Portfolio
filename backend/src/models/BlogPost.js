const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    excerpt:   { type: String, required: true },
    content:   { type: String, default: '' },
    image:     { type: String, default: '' },
    tags:      [{ type: String }],
    readTime:  { type: String, default: '5 min read' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlogPost', blogPostSchema);
