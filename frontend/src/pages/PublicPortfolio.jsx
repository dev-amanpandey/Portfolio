import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ArrowDown, ArrowUpRight, Award, Briefcase, ChevronLeft, ChevronRight, Code2, Download, Github,
  Home, Linkedin, Mail, Menu, Moon, Send, Sun, UserRound, X
} from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import CertificateCard from '../components/CertificateCard';
import { certificateAPI, contactAPI, projectAPI, resumeAPI } from '../api';

gsap.registerPlugin(ScrollTrigger, SplitText);

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
  const pageRef = useRef(null);
  const preloaderRef = useRef(null);
  const preloaderCountRef = useRef(null);
  const preloaderBarRef = useRef(null);
  const [active, setActive] = useState('home');
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const projectsRef = useRef(null);
  const [certificates, setCertificates] = useState([]);
  const [certificateError, setCertificateError] = useState('');
  const [resume, setResume] = useState(null);
  const certificatesRef = useRef(null);

  useGSAP(() => {
    const page = pageRef.current;
    const preloader = preloaderRef.current;
    const root = document.documentElement;
    const media = gsap.matchMedia();
    const cursorDot = page.querySelector('.cursor-dot');
    const cursorRing = page.querySelector('.cursor-ring');
    const sectionHeadings = page.querySelectorAll('.section h2');
    const projectCards = page.querySelectorAll('.project-card');
    const motionItems = page.querySelectorAll('.section > .eyebrow, .section-lead, .about-section > div > p:not(.eyebrow), .skill-layout, .contact-grid, .page-footer');
    const heroHeading = page.querySelector('.hero h1');
    const heroRole = page.querySelector('.hero .role');
    const heroSubtitle = page.querySelector('.hero .intro');
    const heroActions = page.querySelector('.hero-actions');
    const splitInstances = [];
    const cleanups = [];
    let lenis;

    const showEverything = () => {
      gsap.set(page.querySelectorAll('.motion-reveal'), { clearProps: 'all', opacity: 1 });
      gsap.set([sectionHeadings, motionItems, projectCards], { clearProps: 'all', opacity: 1 });
      gsap.set([heroHeading, heroRole], { clearProps: 'all', visibility: 'visible' });
      gsap.set([heroSubtitle, heroActions], { clearProps: 'all', autoAlpha: 1 });
      gsap.set(preloader, { autoAlpha: 0, display: 'none' });
    };

    media.add('(prefers-reduced-motion: reduce)', () => {
      showEverything();
      return () => {};
    });

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const touch = window.matchMedia('(pointer: coarse), (max-width: 767px)').matches;
      const desktop = window.matchMedia('(pointer: fine) and (min-width: 768px)').matches;
      const sessionKey = 'aman-portfolio-preloader-seen';
      let seen = false;

      try {
        seen = sessionStorage.getItem(sessionKey) === 'true';
      } catch {
        seen = false;
      }

      if (seen) {
        gsap.set(preloader, { autoAlpha: 0, display: 'none' });
      } else {
        const counter = { value: 0 };
        const preloaderTimeline = gsap.timeline({
          defaults: { ease: 'expo.inOut' },
          onComplete: () => {
            try {
              sessionStorage.setItem(sessionKey, 'true');
            } catch {
              // Storage can be unavailable in privacy-restricted browsers.
            }
          },
        });
        preloaderTimeline
          .to(counter, { value: 100, duration: 1.55, ease: 'power2.out', onUpdate: () => {
            if (preloaderCountRef.current) preloaderCountRef.current.textContent = `${Math.round(counter.value)}%`;
          } })
          .to(preloaderBarRef.current, { scaleX: 1, duration: 0.35 }, '<')
          .to(preloader, { yPercent: -100, duration: 0.75, ease: 'expo.inOut' })
          .add(() => gsap.set(preloader, { display: 'none' }));
      }

      const heroSplits = [heroHeading, heroRole].filter(Boolean).map((element) => {
        const split = SplitText.create(element, { type: 'lines', mask: 'lines' });
        splitInstances.push(split);
        return split;
      });
      const heroLines = heroSplits.flatMap((split) => split.lines);
      gsap.set([heroHeading, heroRole], { visibility: 'visible' });
      gsap.set(heroLines, { yPercent: 110 });
      gsap.set([heroSubtitle, heroActions], { y: 30, autoAlpha: 0 });

      gsap.timeline({ delay: seen ? 0.15 : 2.35 })
        .to(heroLines, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 })
        .to([heroSubtitle, heroActions], { y: 0, autoAlpha: 1, duration: 0.75, ease: 'power3.out', stagger: 0.1 }, '-=0.6');

      gsap.set([...sectionHeadings, ...motionItems, ...projectCards], { y: 60, autoAlpha: 0 });
      [...sectionHeadings, ...motionItems].forEach((element) => {
        gsap.to(element, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 80%', once: true } });
      });
      projectCards.forEach((card, index) => {
        gsap.to(card, { y: 0, autoAlpha: 1, duration: 0.8, delay: index * 0.15, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 80%', once: true } });
      });

      const aboutWords = [];
      page.querySelectorAll('.about-section > div:first-child > p:not(.eyebrow)').forEach((paragraph) => {
        const split = SplitText.create(paragraph, { type: 'words' });
        splitInstances.push(split);
        aboutWords.push(...split.words);
      });
      if (aboutWords.length) {
        gsap.set(aboutWords, { opacity: 0.25 });
        gsap.to(aboutWords, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '.about-section', start: 'top 70%', end: 'bottom 45%', scrub: true } });
      }

      if (desktop) {
        const ticker = page.querySelector('.tech-marquee-track');
        if (ticker) {
          const tickerTween = gsap.to(ticker, { xPercent: -50, duration: 24, repeat: -1, ease: 'none' });
          const stopTicker = () => tickerTween.pause();
          const startTicker = () => tickerTween.resume();
          ticker.addEventListener('mouseenter', stopTicker);
          ticker.addEventListener('mouseleave', startTicker);
          cleanups.push(() => { ticker.removeEventListener('mouseenter', stopTicker); ticker.removeEventListener('mouseleave', startTicker); });
        }

        page.querySelectorAll('.project-image, .project-image-placeholder').forEach((image) => gsap.fromTo(image, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: true } }));
        projectCards.forEach((card) => {
          const image = card.querySelector('.project-image, .project-image-placeholder');
          const enter = () => { gsap.to(card, { y: -5, duration: 0.3, ease: 'power2.out' }); if (image) gsap.to(image, { scale: 1.06, duration: 0.45, ease: 'power2.out' }); };
          const leave = () => { gsap.to(card, { y: 0, duration: 0.35, ease: 'power2.out' }); if (image) gsap.to(image, { scale: 1, duration: 0.45, ease: 'power2.out' }); };
          card.addEventListener('mouseenter', enter);
          card.addEventListener('mouseleave', leave);
          cleanups.push(() => { card.removeEventListener('mouseenter', enter); card.removeEventListener('mouseleave', leave); });
        });

        if (cursorDot && cursorRing) {
          const dotX = gsap.quickTo(cursorDot, 'x', { duration: 0.12, ease: 'power3' });
          const dotY = gsap.quickTo(cursorDot, 'y', { duration: 0.12, ease: 'power3' });
          const ringX = gsap.quickTo(cursorRing, 'x', { duration: 0.45, ease: 'power3' });
          const ringY = gsap.quickTo(cursorRing, 'y', { duration: 0.45, ease: 'power3' });
          const moveCursor = (event) => { dotX(event.clientX); dotY(event.clientY); ringX(event.clientX); ringY(event.clientY); };
          const interactive = page.querySelectorAll('a, button, .project-card');
          const grow = () => gsap.to(cursorRing, { scale: 1.8, duration: 0.25, ease: 'power2.out' });
          const shrink = () => gsap.to(cursorRing, { scale: 1, duration: 0.25, ease: 'power2.out' });
          window.addEventListener('pointermove', moveCursor);
          root.classList.add('custom-cursor-active');
          interactive.forEach((element) => { element.addEventListener('mouseenter', grow); element.addEventListener('mouseleave', shrink); });
          cleanups.push(() => { window.removeEventListener('pointermove', moveCursor); root.classList.remove('custom-cursor-active'); interactive.forEach((element) => { element.removeEventListener('mouseenter', grow); element.removeEventListener('mouseleave', shrink); }); });
        }

        page.querySelectorAll('.primary, .secondary, .talk-button, .social-line a, .contact-icons a').forEach((button) => {
          const move = (event) => {
            const bounds = button.getBoundingClientRect();
            const x = (event.clientX - (bounds.left + bounds.width / 2)) / 120;
            const y = (event.clientY - (bounds.top + bounds.height / 2)) / 120;
            gsap.to(button, { x: x * 18, y: y * 18, duration: 0.3, ease: 'power2.out' });
          };
          const reset = () => gsap.to(button, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
          button.addEventListener('pointermove', move);
          button.addEventListener('pointerleave', reset);
          cleanups.push(() => { button.removeEventListener('pointermove', move); button.removeEventListener('pointerleave', reset); });
        });
      }

      const topbar = page.querySelector('.topbar');
      let lastScroll = window.scrollY;
      const updateNav = () => {
        const currentScroll = window.scrollY;
        if (topbar) {
          topbar.classList.toggle('scrolled', currentScroll > 24);
          if (currentScroll > lastScroll && currentScroll > 120) topbar.classList.add('nav-hidden');
          else if (currentScroll < lastScroll) topbar.classList.remove('nav-hidden');
        }
        lastScroll = currentScroll;
      };
      window.addEventListener('scroll', updateNav, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', updateNav));

      if (!touch) {
        lenis = new Lenis();
        lenis.on('scroll', ScrollTrigger.update);
        const tickerCallback = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(tickerCallback);
        gsap.ticker.lagSmoothing(0);
        cleanups.push(() => { gsap.ticker.remove(tickerCallback); lenis.destroy(); });
      }

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener('load', refresh);
      document.fonts?.ready.then(refresh);
      cleanups.push(() => window.removeEventListener('load', refresh));
      return () => cleanups.forEach((cleanup) => cleanup());
    });

    return () => { splitInstances.forEach((split) => split.revert()); media.revert(); ScrollTrigger.getAll().forEach((trigger) => trigger.kill()); };
  }, { scope: pageRef });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    projectAPI.publicList()
      .then((result) => setProjects(result.data || []))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    resumeAPI.publicCurrent()
      .then((result) => setResume(result.data || null))
      .catch(() => setResume(null));
  }, []);

  useEffect(() => {
    certificateAPI.list()
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
      const result = await contactAPI.send(Object.fromEntries(formData.entries()));
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
    <div className="site-shell" ref={pageRef}>
      <div className="preloader" ref={preloaderRef} aria-hidden="true">
        <span ref={preloaderCountRef}>0%</span>
        <div className="preloader-track"><i ref={preloaderBarRef} /></div>
      </div>
      <div className="cursor-dot" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
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
              {resume && <a className="secondary" href={resumeAPI.downloadUrl()}>Download Resume <Download size={17} /></a>}
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
            <img src="/images/profile2.jpeg" alt="Aman Pandey" />
            {/* <div className="experience-card"><strong>2+</strong><span>Years of<br />Experience</span></div> */}
          </div>
          <button className="scroll-hint" onClick={() => jump('about')}>Scroll Down <span><ArrowDown size={18} /></span></button>
        </section>

        <section className="tech-strip" aria-label="Technologies I work with">
          <span>Trusted by technologies</span>
          <div className="tech-marquee">
            <div className="tech-marquee-track">
              <div className="tech-marquee-row">
                <b>⚛ <i>React</i></b>
                <b>⬡ <i>Node.js</i></b>
                <b>◈ <i>MongoDB</i></b>
                <b className="express">express</b>
                <b className="tailwind">〰 <i>tailwindcss</i></b>
              </div>
              <div className="tech-marquee-row" aria-hidden="true">
                <b>⚛ <i>React</i></b>
                <b>⬡ <i>Node.js</i></b>
                <b>◈ <i>MongoDB</i></b>
                <b className="express">express</b>
                <b className="tailwind">〰 <i>tailwindcss</i></b>
              </div>
            </div>
          </div>
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
            {resume && <a className="primary compact" href={resumeAPI.downloadUrl()}>Download Resume <Download size={15} /></a>}
          </div>
          <div className="about-photo">
            <div className="dot-grid" /><div className="backdrop" /><img src="/images/profile2.jpeg" alt="Aman Pandey" />
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
