import { useState } from 'react';
import { ArrowUpRight, Award, FileText } from 'lucide-react';

const isImageFile = (certificate) => {
  if (certificate.mimeType && certificate.mimeType.startsWith('image/')) return true;
  const target = certificate.fileUrl || certificate.fileName || '';
  return /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(target);
};

const isPdfFile = (certificate) => {
  if (certificate.mimeType === 'application/pdf') return true;
  const target = certificate.fileUrl || certificate.fileName || '';
  return /\.pdf$/i.test(target);
};

const resolveFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_URL || '';
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
  }
  return url;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(`${dateString}T00:00:00`);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
};

export default function CertificateCard({ certificate }) {
  const [imgError, setImgError] = useState(false);

  const fileUrl = resolveFileUrl(certificate.fileUrl);
  const isImage = isImageFile(certificate);
  const isPdf = isPdfFile(certificate);
  const formattedDate = formatDate(certificate.issuedOn);

  return (
    <article className="certificate-card">
      {/* 1. Actual Certificate Image / Preview Container */}
      <div className="certificate-image-wrapper">
        {isImage && fileUrl && !imgError ? (
          <img
            src={fileUrl}
            alt={certificate.title}
            className="certificate-image"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : isPdf ? (
          <div className="certificate-pdf-preview" aria-label="PDF Certificate">
            <div className="certificate-pdf-icon-wrap">
              <FileText size={36} />
            </div>
            <span className="certificate-pdf-badge">PDF Certificate</span>
            <span className="certificate-pdf-name">{certificate.fileName || certificate.title}</span>
          </div>
        ) : (
          <div className="certificate-fallback-preview" aria-label={certificate.title}>
            <div className="certificate-fallback-icon-wrap">
              <Award size={36} />
            </div>
            <span className="certificate-fallback-text">Certificate Preview Unavailable</span>
          </div>
        )}
      </div>

      {/* 2. Certificate Information */}
      <div className="certificate-info">
        <div className="certificate-header">
          <h3 className="certificate-title" title={certificate.title}>
            {certificate.title}
          </h3>
          <p className="certificate-issuer">{certificate.issuer}</p>
          {(formattedDate || certificate.credentialId) && (
            <div className="certificate-meta">
              {formattedDate && <span>Issued {formattedDate}</span>}
              {formattedDate && certificate.credentialId && <span> · </span>}
              {certificate.credentialId && <span>ID: {certificate.credentialId}</span>}
            </div>
          )}
        </div>

        {/* 3. Action Link */}
        {fileUrl && (
          <div className="certificate-actions">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="certificate-view-link"
              aria-label={`View full certificate: ${certificate.title}`}
            >
              View Certificate <ArrowUpRight size={16} />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
