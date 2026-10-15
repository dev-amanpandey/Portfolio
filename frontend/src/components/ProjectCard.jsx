import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Code2, Github, Layers, X } from 'lucide-react';

const getTechList = (techStack) => {
  if (!techStack) return [];
  const values = Array.isArray(techStack) ? techStack : [techStack];
  return values.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
};

const formatCategory = (category) => {
  if (!category) return '';
  const categoryMap = { 'web-apps': 'Web App', 'full-stack': 'Full Stack', frontend: 'Frontend', backend: 'Backend' };
  return categoryMap[category.toLowerCase()] || category.replace(/-/g, ' ');
};

export default function ProjectCard({ project }) {
  const [imgError, setImgError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const cardRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeTimerRef = useRef(null);
  const openedWithKeyboardRef = useRef(false);
  const suppressFocusOpenRef = useRef(false);
  const techList = getTechList(project.techStack);
  const category = formatCategory(project.category);
  const Icon = project.category === 'full-stack' ? Layers : Code2;

  const updatePosition = () => {
    const card = cardRef.current;
    if (!card) return;
    const safeLeft = window.matchMedia('(min-width: 901px)').matches ? 92 : 16;
    const safeTop = window.matchMedia('(min-width: 901px)').matches ? 116 : 16;
    const width = Math.min(440, window.innerWidth - safeLeft - 16);
    const maxHeight = Math.min(window.innerHeight - safeTop - 16, 560);
    const rect = card.getBoundingClientRect();
    setPreviewPosition({
      width,
      maxHeight,
      left: Math.max(safeLeft, Math.min(rect.left + (rect.width - width) / 2, window.innerWidth - width - 16)),
      top: Math.max(safeTop, Math.min(rect.top - 28, window.innerHeight - maxHeight - 16)),
    });
  };

  const openPreview = (keyboard = false) => {
    window.clearTimeout(closeTimerRef.current);
    openedWithKeyboardRef.current = keyboard;
    updatePosition();
    setPreviewOpen(true);
    if (keyboard) requestAnimationFrame(() => closeButtonRef.current?.focus());
  };

  const scheduleClose = () => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setPreviewOpen(false), 140);
  };

  const closePreview = (restoreFocus = false) => {
    window.clearTimeout(closeTimerRef.current);
    setPreviewOpen(false);
    if (restoreFocus) requestAnimationFrame(() => {
      suppressFocusOpenRef.current = true;
      cardRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!previewOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closePreview(openedWithKeyboardRef.current);
      }
    };
    const reposition = () => updatePosition();
    const closeOnScroll = () => setPreviewOpen(false);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [previewOpen]);

  const handleCardKeyDown = (event) => {
    if (event.target !== cardRef.current) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPreview(true);
    }
    if (event.key === 'Escape' && previewOpen) closePreview(true);
  };

  const stopCardClick = (event) => event.stopPropagation();
  const projectImage = (className) => (project.image && !imgError ? (
    <img src={project.image} alt={project.title} className={className} loading="lazy" onError={() => setImgError(true)} />
  ) : (
    <div className="project-image-placeholder" aria-label={project.title}>
      <div className="placeholder-icon-wrap"><Icon size={28} /></div>
      <span className="placeholder-title">{project.title}</span>
    </div>
  ));

  return (
    <>
      <article
        className="project-card"
        ref={cardRef}
        tabIndex={0}
        aria-label={`${project.title} project preview`}
        aria-haspopup="dialog"
        aria-expanded={previewOpen}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) openPreview();
        }}
        onPointerLeave={scheduleClose}
        onFocus={(event) => {
          if (!event.currentTarget.matches(':focus-visible')) return;
          if (suppressFocusOpenRef.current) {
            suppressFocusOpenRef.current = false;
            return;
          }
          openPreview(true);
        }}
        onKeyDown={handleCardKeyDown}
        onClick={(event) => { if (!event.target.closest('a, button')) openPreview(false); }}
      >
        <div className="project-image-container">{projectImage('project-image')}</div>
        <div className="project-content project-card-summary">
          <div className="project-header">
            <h3 className="project-title" title={project.title}>{project.title}</h3>
            {category && <span className="project-category-badge">{category}</span>}
          </div>
          <span className="project-card-hint">Open project preview</span>
        </div>
      </article>

      {previewOpen && previewPosition && createPortal(
        <article
          className="project-preview-layer"
          role="dialog"
          aria-label={`${project.title} project details`}
          style={previewPosition}
          onPointerEnter={() => window.clearTimeout(closeTimerRef.current)}
          onPointerLeave={scheduleClose}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget) && !cardRef.current?.contains(event.relatedTarget)) scheduleClose();
          }}
        >
          <div className="project-preview-image">{projectImage('project-image')}</div>
          <button
            type="button"
            className="project-preview-close"
            ref={closeButtonRef}
            aria-label="Close project preview"
            onClick={() => closePreview(openedWithKeyboardRef.current)}
          ><X size={18} /></button>
          <div className="project-preview-content">
            <div className="project-header">
              <h3 className="project-title">{project.title}</h3>
              {category && <span className="project-category-badge">{category}</span>}
            </div>
            <p className="project-description">{project.description || 'A project built with care and attention to detail.'}</p>
            {techList.length > 0 && (
              <div className="project-tech-wrapper">
                <div className="project-tech-list" aria-label="Technologies used">
                  {techList.map((tech, index) => <span key={`${tech}-${index}`} className="tech-badge">{tech}</span>)}
                </div>
              </div>
            )}
            {(project.liveUrl || project.githubUrl) && (
              <div className="project-actions">
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noreferrer" className="project-btn project-btn-primary" onClick={stopCardClick}>
                    View Live Demo <ArrowUpRight size={15} />
                  </a>
                )}
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noreferrer" className="project-btn project-btn-secondary" onClick={stopCardClick}>
                    <Github size={15} /><span>GitHub Repository</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </article>,
        document.body,
      )}
    </>
  );
}
