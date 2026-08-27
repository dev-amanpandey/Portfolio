const mongoose = require('mongoose');
require('dotenv').config({ path: `${__dirname}/../../.env` });

const Project  = require('./models/Project');
const BlogPost = require('./models/BlogPost');

// ── Seed Data ─────────────────────────────────────────────────────────────────

const projects = [
  {
    title: 'ShopEasy',
    description:
      'A complete e-commerce platform with user authentication, product browsing, cart management, secure Stripe payments and admin order tracking.',
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Stripe', 'TailwindCSS'],
    liveUrl:   'https://shopeasy-demo.vercel.app',
    githubUrl: 'https://github.com/amanpandey/shopeasy',
    image:     'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    category:  'full-stack',
    status:    'Full Time',
    featured:  true,
    keyFeatures: [
      'User authentication & authorization (JWT)',
      'Browse products and categories with filters',
      'Shopping cart & wishlist management',
      'Secure payment gateway (Stripe)',
      'Order tracking & history dashboard',
      'Responsive modern UI with dark mode',
    ],
    whatILearned:
      'This project deepened my skills in full-stack architecture, Redux Toolkit for state management, Stripe payment integration, and deploying a production MERN application on Vercel + Railway.',
    order: 1,
  },
  {
    title: 'StudyNotion',
    description:
      'EdTech platform for online learning — create & sell courses, upload video lectures, track student progress, and manage payments.',
    techStack: ['React', 'Node.js', 'MongoDB', 'Cloudinary', 'Razorpay', 'Redux'],
    liveUrl:   'https://studynotion-demo.vercel.app',
    githubUrl: 'https://github.com/amanpandey/studynotion',
    image:     'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80',
    category:  'full-stack',
    status:    'Full Time',
    featured:  true,
    keyFeatures: [
      'Instructor & student role-based access',
      'Course creation with video lecture upload (Cloudinary)',
      'Student progress and completion tracking',
      'Razorpay payment integration',
      'Admin analytics dashboard',
    ],
    whatILearned:
      'Learned how to architect a large-scale LMS, manage file uploads to cloud storage, handle complex role-based authorization, and optimize React performance with memoization.',
    order: 2,
  },
  {
    title: 'Sonara Music',
    description:
      'A sleek music streaming platform — browse songs, build playlists, and enjoy seamless audio playback with a beautifully animated player.',
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Web Audio API'],
    liveUrl:   'https://sonara-demo.vercel.app',
    githubUrl: 'https://github.com/amanpandey/sonara',
    image:     'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
    category:  'full-stack',
    status:    'Part Time',
    featured:  false,
    keyFeatures: [
      'Audio streaming with Web Audio API',
      'Playlist creation & management',
      'Search and filter by artist/genre',
      'Persistent playback state across navigation',
    ],
    whatILearned:
      'Gained deep experience with browser audio APIs, streaming media, building interactive animated music player UIs, and managing complex global state.',
    order: 3,
  },
  {
    title: 'Weather App',
    description:
      'Real-time weather dashboard using OpenWeather API. Dynamic UI adapts visually to current weather conditions with animated themes.',
    techStack: ['React', 'OpenWeather API', 'CSS Animations', 'Geolocation API'],
    liveUrl:   'https://weather-aman.vercel.app',
    githubUrl: 'https://github.com/amanpandey/weather-app',
    image:     'https://images.unsplash.com/photo-1504608524841-42584120d693?w=800&q=80',
    category:  'frontend',
    status:    'Personal',
    featured:  false,
    keyFeatures: [
      'Real-time weather data via OpenWeather API',
      'Browser Geolocation auto-detection',
      'Dynamic weather-based animated themes',
      '5-day hourly forecast view',
    ],
    whatILearned:
      'Practiced integrating third-party APIs, handling browser Geolocation, and creating visually rich, data-driven UI components with CSS keyframe animations.',
    order: 4,
  },
];

const blogPosts = [
  {
    title:   'Building Scalable Full Stack Apps with MERN',
    excerpt: 'Learn how to structure and scale your MERN stack application from zero to production with best practices, folder structure, and deployment tips.',
    content: 'Full article content here...',
    image:   'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    tags:    ['MERN', 'MongoDB', 'React', 'Node.js'],
    readTime: '8 min read',
  },
  {
    title:   'Mastering Tailwind CSS — Tips & Tricks',
    excerpt: 'Discover advanced Tailwind CSS techniques to build pixel-perfect designs faster, including custom plugins, JIT mode, and component extraction patterns.',
    content: 'Full article content here...',
    image:   'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80',
    tags:    ['CSS', 'TailwindCSS', 'Design', 'Frontend'],
    readTime: '6 min read',
  },
  {
    title:   'Authentication in Node.js — The Right Way',
    excerpt: 'A comprehensive guide to implementing secure JWT-based authentication in Node.js: bcrypt hashing, refresh tokens, and protecting routes properly.',
    content: 'Full article content here...',
    image:   'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&q=80',
    tags:    ['Node.js', 'Authentication', 'Security', 'JWT'],
    readTime: '10 min read',
  },
];

// ── Run Seed ──────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio');
    console.log('✅ Connected to MongoDB');

    await Project.deleteMany({});
    await BlogPost.deleteMany({});
    console.log('🗑  Cleared existing data');

    await Project.insertMany(projects);
    await BlogPost.insertMany(blogPosts);

    console.log(`\n🌱 Database seeded successfully!`);
    console.log(`   ✔ ${projects.length} projects inserted`);
    console.log(`   ✔ ${blogPosts.length} blog posts inserted\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
