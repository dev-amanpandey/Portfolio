import { useEffect, useState } from 'react';
import { ExternalLink, Image, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { projectAPI } from '../api';

const emptyForm = { title: '', description: '', fullDescription: '', techStack: '', githubUrl: '', liveUrl: '', image: null, publicationStatus: 'published', featured: false, displayOrder: 0, category: 'full-stack' };

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    try {
      const result = await projectAPI.list();
      setProjects(result.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);
  const updateForm = (values) => setForm((current) => ({ ...current, ...values }));
  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(''); setFormOpen(true); };
  const openEdit = (project) => {
    setEditing(project);
    setForm({ title: project.title, description: project.description, fullDescription: project.whatILearned || '', techStack: (project.techStack || []).join(', '), githubUrl: project.githubUrl || '', liveUrl: project.liveUrl || '', image: null, publicationStatus: project.publicationStatus || 'published', featured: Boolean(project.featured), displayOrder: project.displayOrder ?? project.order ?? 0, category: project.category || 'full-stack' });
    setError('');
    setFormOpen(true);
  };
  const closeForm = () => { if (!saving) { setFormOpen(false); setEditing(null); setForm(emptyForm); } };

  const submit = async (event) => {
    event.preventDefault();
    if (form.image && form.image.size > 10 * 1024 * 1024) { setError('Project image must be 10 MB or smaller.'); return; }
    setSaving(true); setError(''); setMessage('');
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => { if (key !== 'image') formData.append(key, value); });
    if (form.image) formData.append('image', form.image);
    try {
      const result = editing ? await projectAPI.update(editing._id, formData) : await projectAPI.create(formData);
      setMessage(result.message); setFormOpen(false); setEditing(null); setForm(emptyForm); await loadProjects();
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };

  const changeStatus = async (project, changes) => {
    setBusyId(project._id); setError(''); setMessage('');
    try {
      const result = await projectAPI.updateStatus(project._id, changes);
      setMessage(result.message);
      setProjects((current) => current.map((item) => item._id === project._id ? result.data : item));
    } catch (requestError) { setError(requestError.message); } finally { setBusyId(null); }
  };

  const remove = async (project) => {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    setBusyId(project._id); setError(''); setMessage('');
    try {
      const result = await projectAPI.remove(project._id);
      setMessage(result.message); setProjects((current) => current.filter((item) => item._id !== project._id));
    } catch (requestError) { setError(requestError.message); } finally { setBusyId(null); }
  };

  return <section className="admin-projects" aria-labelledby="projects-heading">
    <div className="admin-section-header"><div><p className="admin-eyebrow">Portfolio management</p><h2 id="projects-heading">Projects</h2><p>Create and control the projects shown on your public portfolio.</p></div><button className="admin-primary-button" onClick={openAdd} type="button"><Plus size={17} /> Add Project</button></div>
    {message && <p className="admin-success-message" role="status">{message}</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
    {formOpen && <form className="certificate-admin-form" onSubmit={submit}>
      <div className="admin-form-header"><h3>{editing ? 'Edit Project' : 'Add Project'}</h3><button className="icon-button" type="button" onClick={closeForm} disabled={saving} aria-label="Close project form"><X size={19} /></button></div>
      <div className="admin-form-grid"><label>Project Title<input value={form.title} onChange={(event) => updateForm({ title: event.target.value })} required disabled={saving} /></label><label>Category<select value={form.category} onChange={(event) => updateForm({ category: event.target.value })} disabled={saving}><option value="web-apps">Web Apps</option><option value="full-stack">Full Stack</option><option value="frontend">Frontend</option></select></label></div>
      <label className="admin-wide-field">Short Description<textarea value={form.description} onChange={(event) => updateForm({ description: event.target.value })} required disabled={saving} rows="3" /></label>
      <label className="admin-wide-field">Full Description <span>(optional)</span><textarea value={form.fullDescription} onChange={(event) => updateForm({ fullDescription: event.target.value })} disabled={saving} rows="3" /></label>
      <div className="admin-form-grid"><label>Technologies / Tech Stack<input value={form.techStack} onChange={(event) => updateForm({ techStack: event.target.value })} placeholder="React, Node.js, MongoDB" disabled={saving} /></label><label>Display Order<input type="number" min="0" value={form.displayOrder} onChange={(event) => updateForm({ displayOrder: event.target.value })} disabled={saving} /></label><label>GitHub URL<input type="url" value={form.githubUrl} onChange={(event) => updateForm({ githubUrl: event.target.value })} disabled={saving} /></label><label>Live Demo URL<input type="url" value={form.liveUrl} onChange={(event) => updateForm({ liveUrl: event.target.value })} disabled={saving} /></label></div>
      <label className="admin-file-field">Project Image {editing && <span>(leave empty to keep the current image)</span>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => updateForm({ image: event.target.files[0] || null })} disabled={saving} /><small>JPG, JPEG, PNG, or WEBP · maximum 10 MB.</small></label>
      <div className="admin-toggle-row"><label><input type="checkbox" checked={form.publicationStatus === 'published'} onChange={(event) => updateForm({ publicationStatus: event.target.checked ? 'published' : 'draft' })} disabled={saving} /> Published</label><label><input type="checkbox" checked={form.featured} onChange={(event) => updateForm({ featured: event.target.checked })} disabled={saving} /> Featured</label></div>
      <div className="admin-form-actions"><button className="admin-secondary-button" type="button" onClick={closeForm} disabled={saving}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Project'}</button></div>
    </form>}
    {loading ? <p className="admin-empty-state">Loading projects…</p> : projects.length ? <div className="admin-project-list">{projects.map((project) => <article className="admin-project-card" key={project._id}><div className="admin-project-image">{project.image ? <img src={project.image} alt="" /> : <Image size={24} />}</div><div className="admin-certificate-details"><h3>{project.title}</h3><p>{project.publicationStatus || 'published'} · {project.featured ? 'Featured' : 'Not featured'}</p><small>Display order: {project.displayOrder ?? project.order ?? 0}</small></div><div className="admin-certificate-actions"><a href={project.liveUrl || project.githubUrl || '#'} target="_blank" rel="noreferrer" className="admin-action-link">View <ExternalLink size={15} /></a><button type="button" onClick={() => openEdit(project)} disabled={busyId === project._id}><Pencil size={15} /> Edit</button><button type="button" onClick={() => changeStatus(project, { publicationStatus: (project.publicationStatus || 'published') === 'published' ? 'draft' : 'published' })} disabled={busyId === project._id}>{(project.publicationStatus || 'published') === 'published' ? 'Unpublish' : 'Publish'}</button><button type="button" onClick={() => changeStatus(project, { featured: !project.featured })} disabled={busyId === project._id}><Star size={15} /> {project.featured ? 'Unfeature' : 'Feature'}</button><button type="button" className="admin-delete-button" onClick={() => remove(project)} disabled={busyId === project._id}><Trash2 size={15} /> {busyId === project._id ? 'Working…' : 'Delete'}</button></div></article>)}</div> : <p className="admin-empty-state">No projects added yet.</p>}
  </section>;
}
