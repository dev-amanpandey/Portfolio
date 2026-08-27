import { useState } from 'react';
import { ArrowUpRight, Code2, Github, Layers } from 'lucide-react';

const getTechList = (techStack) => {
  if (!techStack) return [];
  if (Array.isArray(techStack)) {
    return techStack
      .flatMap((item) => (typeof item === 'string' ? item.split(',') : [String(item)]))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof techStack === 'string') {
    return techStack
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const formatCategory = (category) => {
  if (!category) return '';
  const categoryMap = {
    'web-apps': 'Web App',
    'full-stack': 'Full Stack',
    'frontend': 'Frontend',
  };
  return categoryMap[category.toLowerCase()] || category.replace(/-/g, ' ');
};

export default function ProjectCard({ project }) {
  const [imgError, setImgError] = useState(false);
  const [showAllTech, setShowAllTech] = useState(false);

  const techList = getTechList(project.techStack);
  const MAX_VISIBLE_TECH = 5;
  const hasMoreTech = techList.length > MAX_VISIBLE_TECH;
  const visibleTech = showAllTech ? techList : techList.slice(0, MAX_VISIBLE_TECH);

  const hasLinks = Boolean(project.liveUrl || project.githubUrl);

  return (
    <article className="project-card">
      {/* 1. Project Image / Media */}
      <div className="project-image-container">
        {project.image && !imgError ? (
          <img
            src={project.image}
            alt={project.title}
            className="project-image"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="project-image-placeholder" aria-label={project.title}>
            <div className="placeholder-icon-wrap">
              {project.category === 'full-stack' ? <Layers size={28} /> : <Code2 size={28} />}
            </div>
            <span className="placeholder-title">{project.title}</span>
          </div>
        )}
      </div>

      {/* 2. Project Content */}
      <div className="project-content">
        {/* Header: Title + Category */}
        <div className="project-header">
          <h3 className="project-title" title={project.title}>
            {project.title}
          </h3>
          {project.category && (
            <span className="project-category-badge">
              {formatCategory(project.category)}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="project-description">
          {project.description}
        </p>

        {/* Tech Stack Tags */}
        {techList.length > 0 && (
          <div className="project-tech-wrapper">
            <div className="project-tech-list" aria-label="Technologies used">
              {visibleTech.map((tech, index) => (
                <span key={`${tech}-${index}`} className="tech-badge">
                  {tech}
                </span>
              ))}
              {hasMoreTech && (
                <button
                  type="button"
                  className="tech-more-btn"
                  onClick={() => setShowAllTech((prev) => !prev)}
                  aria-expanded={showAllTech}
                >
                  {showAllTech ? 'Show less' : `+${techList.length - MAX_VISIBLE_TECH} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {hasLinks && (
          <div className="project-actions">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="project-btn project-btn-primary"
              >
                Live Demo <ArrowUpRight size={15} />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="project-btn project-btn-secondary"
                aria-label={`${project.title} on GitHub`}
              >
                <Github size={15} />
                <span>GitHub</span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
