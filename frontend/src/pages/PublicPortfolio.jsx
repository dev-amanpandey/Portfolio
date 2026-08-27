import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ArrowUpRight, Award, Briefcase, ChevronLeft, ChevronRight, Code2, Download, Github,
  Home, Linkedin, Mail, Menu, Moon, Send, Sun, UserRound, X
} from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import CertificateCard from '../components/CertificateCard';

const navItems = [
  ['Home', 'home'], ['About', 'about'], ['Skills', 'skills'], ['Projects', 'projects'], ['Certificates', 'certificates'], ['Contact', 'contact'],
];

const railNavItems = [
  [Home, 'home'],
  [UserRound, 'about'],
  [Code2, 'skills'],
  [Briefcase, 'projects'],
  [Award, 'certificates'],
  [Mail, 'contact'],
];

const projectFilterTabs = [
  { label: 'All', value: 'all' },
  { label: 'Web Apps', value: 'web-apps' },
  { label: 'Full Stack', value: 'full-stack' },
  { label: 'Frontend', value: 'frontend' },
  { label: 'Backend', value: 'backend' },
];

export default function PublicPortfolio() {
  const [active, setActive] = useState('home');
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const projectsRef = useRef(null);
  const [certificates, setCertificates] = useState([]);
  const [certificateError, setCertificateError] = useState('');
  const certificatesRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    fetch('/api/projects')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load projects.')))
      .then((result) => setProjects(result.data || []))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    fetch('/api/certificates')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load certificates.')))
      .then((result) => setCertificates(result.data || []))
      .catch(() => setCertificateError('Certificates are unavailable right now.'));
  }, []);

  useEffect(() => {
    const sections = navItems.map(([, id]) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const seen = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (seen) setActive(seen.target.id);
    }, { rootMargin: '-25% 0px -55% 0px', threshold: [0.05, 0.2, 0.5] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const jump = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const scrollProjects = (direction) => {
    if (projectsRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      projectsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollCertificates = (direction) => {
    if (certificatesRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      certificatesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to send your message.');
      form.reset();
      window.alert(result.message);
    } catch (error) {
      window.alert(error.message || 'Unable to send your message. Please try again.');
    } finally {
      submitButton.disabled = false;
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (projectFilter === 'all') return true;
    const cat = (project.category || '').toLowerCase().trim();
    return cat === projectFilter || cat === projectFilter.replace('-', ' ') || cat === projectFilter.replace('-', '');
  });

  return (
    <div className="site-shell">
      <aside className="side-rail">
        <button className="monogram" onClick={() => jump('home')} aria-label="Back to home">A<span>.</span></button>
        <nav className="rail-nav" aria-label="Quick navigation">
          {railNavItems.map(([Icon, id]) => (
            <button key={id} className={active === id ? 'current' : ''} onClick={() => jump(id)} aria-label={id}>
              <Icon size={18} />
            </button>
          ))}
        </nav>
        <button className="theme-toggle" onClick={() => setDark(!dark)} aria-label="Toggle colour mode">
          {dark ? <Sun size={18} /> : <Moon size={18} />}<i />
        </button>
      </aside>

      <main>
        <header className="topbar">
          <a className="wordmark" href="#home">Aman<span>.</span></a>
          <nav className={menuOpen ? 'desktop-nav open' : 'desktop-nav'}>
            {navItems.map(([label, id]) => (
              <button className={active === id ? 'active' : ''} key={id} onClick={() => jump(id)}>
                {label}
              </button>
            ))}
          </nav>
          <button className="talk-button" onClick={() => jump('contact')}>Let's Talk <ArrowUpRight size={16} /></button>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </header>

        <section id="home" className="hero section">
          <div className="hero-copy">
            <p className="eyebrow">👋 Hi, I'm</p>
            <h1>Aman<br /><em>Pandey</em></h1>
            <p className="role">Full Stack Web Developer <b>|</b></p>
            <p className="intro">I build clean, scalable and efficient web solutions that solve real-world problems.</p>
            <div className="hero-actions">
              <button className="primary" onClick={() => jump('projects')}>Explore My Work <ArrowUpRight size={18} /></button>
              <a className="secondary" href="/documents/Aman-Pandey-Resume.pdf" download>Download CV <Download size={17} /></a>
            </div>
            <div className="social-line">
              <span>Let's connect</span>
              <div>
                <a href="https://github.com/dev-amanpandey" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={18} /></a>
                <a href="https://www.linkedin.com/in/aman-pandey-b1a267350/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>
                <a href="mailto:amanpandey7651@gmail.com" aria-label="Email"><Mail size={18} /></a>
              </div>
            </div>
          </div>
          <div className="hero-art" aria-label="Portrait of Aman Pandey">
            <div className="dot-grid" /><div className="backdrop" /><div className="rings" />
            <span className="accent-rays">⌁</span>
            <img src="/images/profile.jpeg" alt="Aman Pandey" />
            {/* <div className="experience-card"><strong>2+</strong><span>Years of<br />Experience</span></div> */}
          </div>
          <button className="scroll-hint" onClick={() => jump('about')}>Scroll Down <span><ArrowDown size={18} /></span></button>
        </section>

        <section className="tech-strip" aria-label="Technologies I work with">
          <span>Trusted by technologies</span>
          <b>⚛ <i>React</i></b>
          <b>⬡ <i>Node.js</i></b>
          <b>◈ <i>MongoDB</i></b>
          <b className="express">express</b>
          <b className="tailwind">〰 <i>tailwindcss</i></b>
        </section>

        <section id="about" className="section split-section about-section">
          <div>
            <p className="eyebrow">✦ About Me</p>
            <h2>Get to know me!</h2>
            <p>I'm a passionate Full Stack Developer who loves building web applications that are fast, scalable and user-friendly.</p>
            <p>I enjoy turning ideas into real-world products. When I'm not coding, you'll find me exploring new technologies or in the mountains.</p>
            <dl>
              <div><dt>✦ Name</dt><dd>Aman Pandey</dd></div>
              <div><dt>✦ Email</dt><dd>amanpandey7651@gmail.com</dd></div>
              <div><dt>✦ Location</dt><dd>India</dd></div>
              <div><dt>✦ Experience</dt><dd>Fresher</dd></div>
            </dl>
            <a className="primary compact" href="/documents/Aman-Pandey-Resume.pdf" download>Download CV <Download size={15} /></a>
          </div>
          <div className="about-photo">
            <div className="dot-grid" /><div className="backdrop" /><img src="/images/profile.jpeg" alt="Aman Pandey" />
            <div className="project-count"><strong>10+</strong><span>Projects<br />Completed</span></div>
          </div>
        </section>

        <section id="skills" className="section skills-section">
          <p className="eyebrow">✦ My Skills</p>
          <h2>Technologies I work with</h2>
          <p className="section-lead">A combination of modern technologies I use to build robust and scalable web applications.</p>
          <div className="skill-layout">
            <div className="skill-list">
              <h3>Frontend</h3>
              <p><span>⚛ React</span><span>Next.js</span><span>〰 Tailwind CSS</span><span>JS JavaScript</span><span>TS TypeScript</span><span>▣ HTML</span><span>CSS</span></p>
              <h3>Backend</h3>
              <p><span>⬡ Node.js</span><span>Express.js</span><span>◈ MongoDB</span><span>REST API</span></p>
              <h3>Tools & Others</h3>
              <p><span>Git</span><span>GitHub</span><span>VS Code</span><span>Postman</span><span>Docker</span></p>
            </div>
            <div className="skill-orbits">
              <div><b>90%</b><span>Problem Solving</span></div>
              <div><b>85%</b><span>Development</span></div>
              <div><b>80%</b><span>UI/UX Design</span></div>
            </div>
          </div>
        </section>

        <section id="projects" className="section projects-section">
          <div className="section-header-row">
            <div>
              <p className="eyebrow">✦ My Projects</p>
              <h2>Things I've built</h2>
              <p className="section-lead">Here are some of the projects I've worked on. Each showcases a unique piece of development.</p>
            </div>
            {filteredProjects.length > 1 && (
              <div className="carousel-nav-arrows">
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => scrollProjects('left')}
                  aria-label="Previous projects"
                  title="Scroll left"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => scrollProjects('right')}
                  aria-label="Next projects"
                  title="Scroll right"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
          <div className="filters" role="tablist" aria-label="Filter projects by category">
            {projectFilterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={projectFilter === tab.value ? 'selected' : ''}
                onClick={() => setProjectFilter(tab.value)}
                role="tab"
                aria-selected={projectFilter === tab.value}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {filteredProjects.length > 0 ? (
            <div className="project-carousel-wrapper">
              <div
                className="project-carousel"
                ref={projectsRef}
                tabIndex={0}
                role="region"
                aria-label="Projects carousel"
              >
                {filteredProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            </div>
          ) : (
            <p className="empty-projects">
              {projects.length ? 'No projects match this category.' : 'No projects available yet.'}
            </p>
          )}
        </section>

        <section id="certificates" className="section certificates-section">
          <div className="section-header-row">
            <div>
              <p className="eyebrow">✦ My Certifications</p>
              <h2>Credentials I've earned</h2>
              <p className="section-lead">Professional certifications and credentials.</p>
            </div>
            {certificates.length > 1 && (
              <div className="carousel-nav-arrows">
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => scrollCertificates('left')}
                  aria-label="Previous certificates"
                  title="Scroll left"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => scrollCertificates('right')}
                  aria-label="Next certificates"
                  title="Scroll right"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
          {certificateError ? (
            <p className="certificate-message" role="status">{certificateError}</p>
          ) : (
            <div className="certificate-carousel-wrapper">
              <div
                className="certificate-carousel"
                ref={certificatesRef}
                tabIndex={0}
                role="region"
                aria-label="Certifications carousel"
              >
                {certificates.length ? certificates.map((certificate) => (
                  <CertificateCard key={certificate._id} certificate={certificate} />
                )) : <p className="empty-certificates">No certifications added yet.</p>}
              </div>
            </div>
          )}
        </section>

        <section id="contact" className="section contact-section">
          <p className="eyebrow">✦ Get In Touch</p>
          <h2>Let's work together</h2>
          <div className="contact-grid">
            <div>
              <p>Have a project in mind or just want to say hi? I'd love to hear from you.</p>
              <ul>
                <li><a href="mailto:amanpandey7651@gmail.com">✦　amanpandey7651@gmail.com</a></li>
                <li>✦　India</li>
                <li>✦　+91 7651943978</li>
              </ul>
              <div className="contact-icons">
                <a href="https://github.com/dev-amanpandey" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={18} /></a>
                <a href="https://www.linkedin.com/in/aman-pandey-b1a267350/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>
                <a href="mailto:amanpandey7651@gmail.com" aria-label="Email"><Mail size={18} /></a>
              </div>
            </div>
            <form onSubmit={sendMessage}>
              <div>
                <input name="name" placeholder="Your Name" required />
                <input name="email" type="email" placeholder="Your Email" required />
              </div>
              <input name="subject" placeholder="Subject" />
              <textarea name="message" placeholder="Your Message" rows="5" required />
              <button type="submit" className="primary">Send Message <Send size={15} /></button>
            </form>
          </div>
        </section>
        <footer className="page-footer">© 2026 Aman Pandey. Designed with care.</footer>
      </main>
    </div>
  );
}
