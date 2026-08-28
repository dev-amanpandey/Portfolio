import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, FileText, Trash2, Upload } from 'lucide-react';
import { apiAssetUrl, resumeAPI } from '../api';

const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return 'Unknown size';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function AdminResume() {
  const [resume, setResume] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const loadResume = async () => {
    setLoading(true);
    try {
      const result = await resumeAPI.current();
      setResume(result.data || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResume(); }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setError('');
    setMessage('');
    if (!file) return setSelectedFile(null);
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      event.target.value = '';
      return setError('Please choose a PDF resume.');
    }
    if (file.size > MAX_RESUME_SIZE) {
      event.target.value = '';
      return setError('Resume must be 10 MB or smaller.');
    }
    setSelectedFile(file);
  };

  const uploadResume = async (event) => {
    event.preventDefault();
    if (!selectedFile) return setError('Please choose a PDF resume first.');
    setUploading(true);
    setError('');
    setMessage('');
    const formData = new FormData();
    formData.append('resume', selectedFile);
    try {
      const result = await resumeAPI.upload(formData);
      setResume(result.data);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteResume = async () => {
    if (!window.confirm('Delete the current resume? Visitors will no longer be able to download it.')) return;
    setDeleting(true);
    setError('');
    setMessage('');
    try {
      const result = await resumeAPI.remove();
      setResume(null);
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="admin-resume admin-managed-section" aria-labelledby="resume-heading">
      <div className="admin-section-header">
        <div>
          <p className="admin-eyebrow">Portfolio management</p>
          <h2 id="resume-heading">Resume</h2>
          <p>Upload one PDF that visitors can always view or download as your current resume.</p>
        </div>
      </div>

      {message && <p className="admin-success-message" role="status">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}

      {loading ? <p className="admin-empty-state">Loading resume information…</p> : resume ? (
        <article className="admin-resume-card">
          <div className="admin-certificate-icon"><FileText size={24} /></div>
          <div className="admin-certificate-details">
            <h3>{resume.fileName}</h3>
            <p>Current active resume</p>
            <small>Uploaded {new Date(resume.updatedAt).toLocaleString()} · {formatBytes(resume.fileSize)}</small>
          </div>
          <div className="admin-certificate-actions">
            <a href={apiAssetUrl(resume.fileUrl)} target="_blank" rel="noreferrer" className="admin-action-link">View <ExternalLink size={15} /></a>
            <a href={resumeAPI.downloadUrl()} className="admin-action-link">Download <Download size={15} /></a>
            <button type="button" className="admin-delete-button" onClick={deleteResume} disabled={uploading || deleting}><Trash2 size={15} /> {deleting ? 'Deleting…' : 'Delete'}</button>
          </div>
        </article>
      ) : <p className="admin-empty-state">No resume is live yet. Upload a PDF below to make it available to visitors.</p>}

      <form className="resume-upload-form" onSubmit={uploadResume}>
        <label className="admin-file-field">Resume PDF
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} disabled={uploading || deleting} />
          <small>PDF only · maximum 10 MB. Uploading a new file replaces the current resume.</small>
        </label>
        {selectedFile && <p className="selected-file">Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})</p>}
        <button className="admin-primary-button" type="submit" disabled={!selectedFile || uploading || deleting}>
          <Upload size={17} /> {uploading ? 'Uploading…' : resume ? 'Replace Resume' : 'Upload Resume'}
        </button>
      </form>
    </section>
  );
}
