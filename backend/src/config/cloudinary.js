const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ensureConfigured = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) return;
  const error = new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  error.statusCode = 500;
  throw error;
};

const uploadBuffer = (buffer, options) => {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        error.statusCode = 502;
        return reject(error);
      }
      resolve(result);
    });
    stream.end(buffer);
  });
};

const destroyResource = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  ensureConfigured();
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  if (result.result !== 'ok' && result.result !== 'not found') {
    const error = new Error('Cloudinary could not delete the previous uploaded file.');
    error.statusCode = 502;
    throw error;
  }
};

module.exports = { uploadBuffer, destroyResource };
