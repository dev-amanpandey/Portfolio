import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown, ArrowUpRight, Briefcase, Code2, Download, Github,
  FileText, Home, Linkedin, Mail, Menu, Moon, Send, Sun, Upload, UserRound, X
} from 'lucide-react';
import './styles.css';

const navItems = [
  ['Home', 'home'], ['About', 'about'], ['Skills', 'skills'], ['Projects', 'projects'], ['Certificates', 'certificates'], ['Contact', 'contact'],
];

function App() {
  const [active, setActive] = useState('home');
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [certificateMessage, setCertificateMessage] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    fetch('/api/certificates')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load certificates.')))
      .then((result) => setCertificates(result.data || []))
      .catch(() => setCertificateMessage('Certificates are unavailable right now.'));
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

  const uploadCertificate = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setUploading(true);
    setCertificateMessage('');
    try {
      const response = await fetch('/api/certificates', { method: 'POST', body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to upload certificate.');
      setCertificates((current) => [result.data, ...current]);
      form.reset();
      setCertificateMessage(result.message);
    } catch (error) {
      setCertificateMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  return <div className="site-shell">
    <aside className="side-rail">
      <button className="monogram" onClick={() => jump('home')} aria-label="Back to home">A<span>.</span></button>
      <nav className="rail-nav" aria-label="Quick navigation">
        {[
          [Home, 'home'], [UserRound, 'about'], [Briefcase, 'projects'], [Code2, 'skills'], [Mail, 'contact'],
        ].map(([Icon, id]) => <button key={id} className={active === id ? 'current' : ''} onClick={() => jump(id)} aria-label={id}><Icon size={18}/></button>)}
      </nav>
      <button className="theme-toggle" onClick={() => setDark(!dark)} aria-label="Toggle colour mode">
        {dark ? <Sun size={18}/> : <Moon size={18}/>}<i />
      </button>
    </aside>

    <main>
      <header className="topbar">
        <a className="wordmark" href="#home">Aman<span>.</span></a>
        <nav className={menuOpen ? 'desktop-nav open' : 'desktop-nav'}>
          {navItems.map(([label, id]) => <button className={active === id ? 'active' : ''} key={id} onClick={() => jump(id)}>{label}</button>)}
        </nav>
        <button className="talk-button" onClick={() => jump('contact')}>Let's Talk <ArrowUpRight size={16}/></button>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? <X/> : <Menu/>}</button>
      </header>

      <section id="home" className="hero section">
        <div className="hero-copy">
          <p className="eyebrow">👋 Hi, I'm</p>
          <h1>Aman<br/><em>Pandey</em></h1>
          <p className="role">Full Stack Web Developer <b>|</b></p>
          <p className="intro">I build clean, scalable and efficient web solutions that solve real-world problems.</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => jump('projects')}>Explore My Work <ArrowUpRight size={18}/></button>
            <a className="secondary" href="/documents/Aman-Pandey-Resume.pdf" download>Download CV <Download size={17}/></a>
          </div>
          <div className="social-line">
            <span>Let's connect</span>
            <div><a href="https://github.com/dev-amanpandey" aria-label="GitHub"><Github size={18}/></a><a href="https://www.linkedin.com/in/aman-pandey-b1a267350/" aria-label="LinkedIn"><Linkedin size={18}/></a><a href="mailto:amanpandey7651@gmail.com" aria-label="Email"><Mail size={18}/></a></div>
          </div>
        </div>
        <div className="hero-art" aria-label="Portrait of Aman Pandey">
          <div className="dot-grid" /><div className="backdrop" /><div className="rings" />
          <span className="accent-rays">⌁</span>
          <img src="/images/profile.jpeg" alt="Aman Pandey" />
          <div className="experience-card"><strong>2+</strong><span>Years of<br/>Experience</span></div>
        </div>
        <button className="scroll-hint" onClick={() => jump('about')}>Scroll Down <span><ArrowDown size={18}/></span></button>
      </section>

      <section className="tech-strip" aria-label="Technologies I work with"><span>Trusted by technologies</span><b>⚛ <i>React</i></b><b>⬡ <i>Node.js</i></b><b>◈ <i>MongoDB</i></b><b className="express">express</b><b className="tailwind">〰 <i>tailwindcss</i></b></section>

      <section id="about" className="section split-section about-section">
        <div><p className="eyebrow">✦ About Me</p><h2>Get to know me!</h2><p>I'm a passionate Full Stack Developer who loves building web applications that are fast, scalable and user-friendly.</p><p>I enjoy turning ideas into real-world products. When I'm not coding, you'll find me exploring new technologies or in the mountains.</p><dl><div><dt>✦ Name</dt><dd>Aman Pandey</dd></div><div><dt>✦ Email</dt><dd>amanpandey7651@gmail.com</dd></div><div><dt>✦ Location</dt><dd>India</dd></div><div><dt>✦ Experience</dt><dd>2+ Years</dd></div></dl><a className="primary compact" href="/documents/Aman-Pandey-Resume.pdf" download>Download CV <Download size={15}/></a></div>
        <div className="about-photo"><div className="dot-grid"/><div className="backdrop"/><img src="/images/profile.jpeg" alt="Aman Pandey"/><div className="project-count"><strong>10+</strong><span>Projects<br/>Completed</span></div></div>
      </section>

      <section id="skills" className="section skills-section"><p className="eyebrow">✦ My Skills</p><h2>Technologies I work with</h2><p className="section-lead">A combination of modern technologies I use to build robust and scalable web applications.</p><div className="skill-layout"><div className="skill-list"><h3>Frontend</h3><p><span>⚛ React</span><span>Next.js</span><span>〰 Tailwind CSS</span><span>JS JavaScript</span><span>TS TypeScript</span><span>▣ HTML</span><span>CSS</span></p><h3>Backend</h3><p><span>⬡ Node.js</span><span>Express.js</span><span>◈ MongoDB</span><span>REST API</span></p><h3>Tools & Others</h3><p><span>Git</span><span>GitHub</span><span>VS Code</span><span>Postman</span><span>Docker</span></p></div><div className="skill-orbits"><div><b>90%</b><span>Problem Solving</span></div><div><b>85%</b><span>Development</span></div><div><b>80%</b><span>UI/UX Design</span></div></div></div></section>

      <section id="projects" className="section projects-section"><p className="eyebrow">✦ My Projects</p><h2>Things I've built</h2><p className="section-lead">Here are some of the projects I've worked on. Each showcases a unique piece of development.</p><div className="filters"><button className="selected">All</button><button>Web Apps</button><button>Full Stack</button><button>Frontend</button></div><div className="project-grid">{[
        ['ShopEasy', 'Full Stack', 'E-commerce platform with cart, payments, user authentication and admin dashboard.', "url('/images/shopeasy-homepage.png') center / cover no-repeat", 'https://e-commerce-lac-beta-32.vercel.app/', 'https://github.com/dev-amanpandey/E-commerce'],
        ['StudyNotion', 'Full Stack', 'EdTech platform for online learning, courses, quizzes and more.', "url('/images/studynotion-homepage.png') center / cover no-repeat", 'https://study-notion-rho-vert.vercel.app/', 'https://github.com/dev-amanpandey/StudyNotion'],
        ['Sonara Music', 'Frontend', 'Elegant platform for online learning, courses and notes.', 'linear-gradient(135deg,#1c153a,#b66cff)'],
        ['Weather App', 'Frontend', 'Real-time weather app with location search, forecasts and charts.', 'linear-gradient(135deg,#063b67,#53bcff)'],
      ].map(([name, type, desc, bg, liveUrl, githubUrl]) => <article className="project-card" key={name}><div className="project-visual" style={{background:bg}}><span>◌</span><small>{name}</small></div><div className="project-info"><div><h3>{name}</h3><em>{type}</em></div><p>{desc}</p><footer><span>⚛　⬡　◈</span><a href={liveUrl || '#contact'} target={liveUrl ? '_blank' : undefined} rel={liveUrl ? 'noreferrer' : undefined}>Live Demo <ArrowUpRight size={14}/></a><a href={githubUrl || 'https://github.com'} target={githubUrl ? '_blank' : undefined} rel={githubUrl ? 'noreferrer' : undefined} aria-label={`${name} on GitHub`}><Github size={15}/></a></footer></div></article>)}</div><button className="primary view-more">View More Projects <ArrowUpRight size={17}/></button></section>

      <section id="certificates" className="section certificates-section"><p className="eyebrow">✦ My Certifications</p><h2>Credentials I've earned</h2><p className="section-lead">Keep your professional certificates in one place and share them with visitors.</p><div className="certificate-layout"><form className="certificate-upload" onSubmit={uploadCertificate}><div className="upload-heading"><Upload size={20}/><div><h3>Upload a certificate</h3><p>PDF, JPG, PNG, or WEBP up to 10 MB.</p></div></div><input name="title" placeholder="Certificate title" required/><input name="issuer" placeholder="Issuing organization" required/><input name="issuedOn" type="date" aria-label="Issue date"/><input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required/><button className="primary" type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Certificate'} <Upload size={16}/></button>{certificateMessage && <p className="certificate-message" role="status">{certificateMessage}</p>}</form><div className="certificate-grid">{certificates.length ? certificates.map((certificate) => <article className="certificate-card" key={certificate._id}><div className="certificate-icon"><FileText size={27}/></div><div><h3>{certificate.title}</h3><p>{certificate.issuer}</p>{certificate.issuedOn && <small>Issued {new Date(`${certificate.issuedOn}T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</small>}</div><a href={certificate.fileUrl} target="_blank" rel="noreferrer" aria-label={`Open ${certificate.title}`}><ArrowUpRight size={17}/></a></article>) : <p className="empty-certificates">Your uploaded certificates will appear here.</p>}</div></div></section>

      <section id="contact" className="section contact-section"><p className="eyebrow">✦ Get In Touch</p><h2>Let's work together</h2><div className="contact-grid"><div><p>Have a project in mind or just want to say hi? I'd love to hear from you.</p><ul><li><a href="mailto:amanpandey7651@gmail.com">✦　amanpandey7651@gmail.com</a></li><li>✦　India</li><li>✦　+91 7651943978</li></ul><div className="contact-icons"><a href="https://github.com/dev-amanpandey" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={18}/></a><a href="https://www.linkedin.com/in/aman-pandey-b1a267350/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18}/></a><a href="mailto:amanpandey7651@gmail.com" aria-label="Email"><Mail size={18}/></a></div></div><form onSubmit={sendMessage}><div><input name="name" placeholder="Your Name" required/><input name="email" type="email" placeholder="Your Email" required/></div><input name="subject" placeholder="Subject"/><textarea name="message" placeholder="Your Message" rows="5" required/><button type="submit" className="primary">Send Message <Send size={15}/></button></form></div></section>
      <footer className="page-footer">© 2026 Aman Pandey. Designed with care.</footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
