const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    techStack:   [{ type: String }],
    liveUrl:     { type: String, default: '' },
    githubUrl:   { type: String, default: '' },
    image:       { type: String, default: '' },
    category: {
      type:    String,
      enum:    ['web-apps', 'full-stack', 'frontend'],
      default: 'full-stack',
    },
    status: {
      type:    String,
      enum:    ['Full Time', 'Part Time', 'Freelance', 'Personal'],
      default: 'Personal',
    },
    featured:     { type: Boolean, default: false },
    keyFeatures:  [{ type: String }],
    whatILearned: { type: String, default: '' },
    order:        { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
