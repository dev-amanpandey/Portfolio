import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, FileText, Pencil, Plus, Trash2, X } from 'lucide-react';
import { authAPI, certificateAPI } from '../api';
import AdminProjects from '../components/AdminProjects';
import AdminResume from '../components/AdminResume';

const emptyForm = { title: '', issuer: '', issuedOn: '', credentialId: '', file: null };

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadCertificates = async () => {
    setCertificatesLoading(true);
    try {
      const result = await certificateAPI.list();
      setCertificates(result.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCertificatesLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.me();
        if (!response.ok) throw new Error('Not authenticated');
        const data = await response.json();
        if (data.success) setUser(data.user);
      } catch (_err) {
        // ProtectedRoute redirects unauthenticated visitors before this page is shown.
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    loadCertificates();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authAPI.logout();
      navigate('/admin/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const openAddForm = () => {
    setEditingCertificate(null);
    setForm(emptyForm);
    setError('');
    setFormOpen(true);
  };

  const openEditForm = (certificate) => {
    setEditingCertificate(certificate);
    setForm({ title: certificate.title, issuer: certificate.issuer, issuedOn: certificate.issuedOn || '', credentialId: certificate.credentialId || '', file: null });
    setError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingCertificate(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editingCertificate && !form.file) {
      setError('Please select a certificate file.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('issuer', form.issuer);
    formData.append('issuedOn', form.issuedOn);
    formData.append('credentialId', form.credentialId);
    if (form.file) formData.append('file', form.file);

    try {
      const result = editingCertificate
        ? await certificateAPI.update(editingCertificate._id, formData)
        : await certificateAPI.create(formData);
      setMessage(result.message);
      setFormOpen(false);
      setEditingCertificate(null);
      setForm(emptyForm);
      await loadCertificates();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (certificate) => {
    if (!window.confirm(`Delete “${certificate.title}”? This cannot be undone.`)) return;
    setDeletingId(certificate._id);
    setError('');
    setMessage('');
    try {
      const result = await certificateAPI.remove(certificate._id);
      setMessage(result.message);
      setCertificates((current) => current.filter((item) => item._id !== certificate._id));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="admin-container"><p>Loading...</p></div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} disabled={loggingOut} className="logout-button">{loggingOut ? 'Logging out...' : 'Logout'}</button>
        </div>
      </header>

      <div className="admin-content">
        <AdminProjects />
        <AdminResume />
        <section className="admin-certificates" aria-labelledby="certifications-heading">
          <div className="admin-section-header">
            <div>
              <p className="admin-eyebrow">Portfolio management</p>
              <h2 id="certifications-heading">Certifications</h2>
              <p>Add and maintain the credentials shown on your public portfolio.</p>
            </div>
            <button className="admin-primary-button" onClick={openAddForm} type="button"><Plus size={17} /> Add Certificate</button>
          </div>

          {message && <p className="admin-success-message" role="status">{message}</p>}
          {error && <p className="error-message" role="alert">{error}</p>}

          {formOpen && (
            <form className="certificate-admin-form" onSubmit={handleSubmit}>
              <div className="admin-form-header">
                <h3>{editingCertificate ? 'Edit Certificate' : 'Add Certificate'}</h3>
                <button className="icon-button" type="button" onClick={closeForm} disabled={saving} aria-label="Close certificate form"><X size={19} /></button>
              </div>
              <div className="admin-form-grid">
                <label>Certificate Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required disabled={saving} /></label>
                <label>Issuing Organization<input value={form.issuer} onChange={(event) => setForm({ ...form, issuer: event.target.value })} required disabled={saving} /></label>
                <label>Issue Date<input type="date" value={form.issuedOn} onChange={(event) => setForm({ ...form, issuedOn: event.target.value })} disabled={saving} /></label>
                <label>Credential ID <span>(optional)</span><input value={form.credentialId} onChange={(event) => setForm({ ...form, credentialId: event.target.value })} disabled={saving} /></label>
              </div>
              <label className="admin-file-field">Certificate file {editingCertificate && <span>(leave empty to keep the current file)</span>}
                <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setForm({ ...form, file: event.target.files[0] || null })} disabled={saving} required={!editingCertificate} />
                <small>PDF, JPG, JPEG, PNG, or WEBP · maximum 10 MB.</small>
              </label>
              <div className="admin-form-actions">
                <button className="admin-secondary-button" type="button" onClick={closeForm} disabled={saving}>Cancel</button>
                <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editingCertificate ? 'Save Changes' : 'Upload Certificate'}</button>
              </div>
            </form>
          )}

          {certificatesLoading ? <p className="admin-empty-state">Loading certifications…</p> : certificates.length ? (
            <div className="admin-certificate-list">
              {certificates.map((certificate) => (
                <article className="admin-certificate-card" key={certificate._id}>
                  <div className="admin-certificate-icon"><FileText size={24} /></div>
                  <div className="admin-certificate-details">
                    <h3>{certificate.title}</h3>
                    <p>{certificate.issuer}</p>
                    <small>{certificate.issuedOn ? new Date(`${certificate.issuedOn}T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Issue date not specified'}{certificate.credentialId && ` · Credential ID: ${certificate.credentialId}`}</small>
                  </div>
                  <div className="admin-certificate-actions">
                    <a href={certificate.fileUrl} target="_blank" rel="noreferrer" className="admin-action-link">View <ExternalLink size={15} /></a>
                    <button type="button" onClick={() => openEditForm(certificate)} disabled={deletingId === certificate._id}><Pencil size={15} /> Edit</button>
                    <button type="button" className="admin-delete-button" onClick={() => handleDelete(certificate)} disabled={deletingId === certificate._id}><Trash2 size={15} /> {deletingId === certificate._id ? 'Deleting…' : 'Delete'}</button>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="admin-empty-state">No certifications added yet.</p>}
        </section>
      </div>
    </div>
  );
}
