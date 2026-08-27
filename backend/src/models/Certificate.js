const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issuedOn: { type: String, default: '' },
    credentialId: { type: String, default: '', trim: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
