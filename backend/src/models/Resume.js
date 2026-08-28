const mongoose = require('mongoose');

// This collection intentionally contains at most one document: the active resume.
const resumeSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true, min: 1 },
    mimeType: { type: String, required: true, default: 'application/pdf' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
