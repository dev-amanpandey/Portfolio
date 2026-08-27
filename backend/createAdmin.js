/**
 * Create Admin User Script
 * Run this once to create your first admin account
 * Usage: node createAdmin.js
 */

const readline = require('readline');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config({ path: `${__dirname}/.env` });

const User = require('./src/models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Prompt for admin email and password
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');
    const confirmPassword = await question('Confirm admin password: ');

    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Admin user with this email already exists');
      process.exit(1);
    }

    // Create admin user
    const admin = await User.create({
      email,
      passwordHash: password, // Will be hashed automatically by the pre-save hook
      role: 'admin',
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n🎉 You can now login at http://localhost:5173/admin/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
