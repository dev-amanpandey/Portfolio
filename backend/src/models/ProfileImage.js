const mongoose = require('mongoose');

const profileImageSchema = new mongoose.Schema(
  {
    slot: {
      type: String,
      enum: ['hero', 'about'],
      required: true,
      unique: true,
    },
    fileUrl: { type: String, required: true },
    filePublicId: { type: String, default: '' },
    fileName: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true, min: 1 },
    mimeType: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProfileImage', profileImageSchema);