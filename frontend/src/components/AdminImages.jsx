import { useEffect, useRef, useState } from 'react';
import { Image, Trash2, Upload } from 'lucide-react';
import { apiAssetUrl, profileImagesAPI } from '../api';

const slots = [
  { key: 'hero', label: 'Hero image', description: 'The portrait shown in the main hero section.' },
  { key: 'about', label: 'About image', description: 'The portrait shown beside the About section.' },
];
const maxImageSize = 10 * 1024 * 1024;

export default function AdminImages() {
  const [images, setImages] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState('');
  const [deletingSlot, setDeletingSlot] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inputRefs = useRef({});

  const loadImages = async () => {
    setLoading(true);
    try {
      const result = await profileImagesAPI.current();
      setImages(Object.fromEntries((result.data || []).map((image) => [image.slot, image])));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadImages(); }, []);

  const chooseFile = (slot, event) => {
    const file = event.target.files?.[0] || null;
    setError('');
    setMessage('');
    if (!file) return setSelectedFiles((current) => ({ ...current, [slot]: null }));
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      event.target.value = '';
      return setError('Please choose a JPG, PNG, or WEBP image.');
    }
    if (file.size > maxImageSize) {
      event.target.value = '';
      return setError('Profile images must be 10 MB or smaller.');
    }
    setSelectedFiles((current) => ({ ...current, [slot]: file }));
  };

  const replaceImage = async (slot) => {
    const file = selectedFiles[slot];
    if (!file) return setError('Please choose an image first.');
    setSavingSlot(slot);
    setError('');
    setMessage('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const result = await profileImagesAPI.replace(slot, formData);
      setImages((current) => ({ ...current, [slot]: result.data }));
      setSelectedFiles((current) => ({ ...current, [slot]: null }));
      if (inputRefs.current[slot]) inputRefs.current[slot].value = '';
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingSlot('');
    }
  };

  const deleteImage = async (slot) => {
    if (!window.confirm(`Delete the ${slot} image? The local fallback image will be shown publicly.`)) return;
    setDeletingSlot(slot);
    setError('');
    setMessage('');
    try {
      const result = await profileImagesAPI.remove(slot);
      setImages((current) => { const next = { ...current }; delete next[slot]; return next; });
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingSlot('');
    }
  };

  return (
    <section className="admin-images admin-managed-section" aria-labelledby="images-heading">
      <div className="admin-section-header">
        <div>
          <p className="admin-eyebrow">Portfolio management</p>
          <h2 id="images-heading">Profile Images</h2>
          <p>Manage the two profile images used on your public portfolio.</p>
        </div>
      </div>
      {message && <p className="admin-success-message" role="status">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      {loading ? <p className="admin-empty-state">Loading profile images…</p> : (
        <div className="admin-image-grid">
          {slots.map((slot) => {
            const image = images[slot.key];
            const selectedFile = selectedFiles[slot.key];
            const busy = savingSlot === slot.key || deletingSlot === slot.key;
            return (
              <article className="admin-image-card" key={slot.key}>
                <div className="admin-image-preview">
                  {image ? <img src={apiAssetUrl(image.fileUrl)} alt={`${slot.label} preview`} /> : <Image size={30} />}
                </div>
                <div className="admin-image-details">
                  <h3>{slot.label}</h3>
                  <p>{slot.description}</p>
                  <small>{image ? `${image.fileName} · ${new Date(image.updatedAt).toLocaleString()}` : 'Using the local fallback image'}</small>
                </div>
                <label className="admin-file-field">Choose image
                  <input ref={(element) => { inputRefs.current[slot.key] = element; }} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => chooseFile(slot.key, event)} disabled={busy} />
                  <small>JPG, PNG, or WEBP · maximum 10 MB.</small>
                </label>
                {selectedFile && <p className="selected-file">Selected: {selectedFile.name}</p>}
                <div className="admin-form-actions">
                  <button className="admin-primary-button" type="button" onClick={() => replaceImage(slot.key)} disabled={!selectedFile || busy}><Upload size={16} /> {savingSlot === slot.key ? 'Uploading…' : 'Replace image'}</button>
                  {image && <button className="admin-secondary-button admin-delete-button" type="button" onClick={() => deleteImage(slot.key)} disabled={busy}><Trash2 size={16} /> {deletingSlot === slot.key ? 'Deleting…' : 'Delete'}</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}