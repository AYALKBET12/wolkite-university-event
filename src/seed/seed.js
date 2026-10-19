// Seeds the database with Wolkite University's real structure:
// - 1 main campus + 3 sub-campuses (as confirmed with the user)
// - 1 College + 2 Departments under each campus (sample structure)
// - 1 super_admin account (Main Campus) ready to log in immediately
//
// Run with: npm run seed
// WARNING: this clears existing Campus/College/Department/User data before reseeding.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Campus, College, Department, User } = require('../models');
const { ROLES, USER_STATUS } = require('../config/constants');
const { createOrganizationStructure } = require('./organizationStructure');

async function seed() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('Seeding deletes existing organization and user records. Set ALLOW_DESTRUCTIVE_SEED=true to continue.');
  }
  if (!process.env.SEED_SUPERADMIN_PASSWORD) {
    throw new Error('Set SEED_SUPERADMIN_PASSWORD to a strong, unique password before seeding.');
  }

  await connectDB();

  console.log('Clearing existing org-structure and user data...');
  await Promise.all([
    Campus.deleteMany({}),
    College.deleteMany({}),
    Department.deleteMany({}),
    User.deleteMany({}),
  ]);

  // ---- 1. Campuses, colleges, and departments ----
  const campuses = await createOrganizationStructure();

  // ---- 3. Super Admin account (Main Campus) ----
  console.log('Creating super_admin account...');

  const adminEmail = process.env.SEED_SUPERADMIN_EMAIL || 'admin@wolkiteuniversity.edu.et';
  const adminPassword = process.env.SEED_SUPERADMIN_PASSWORD;

  const superAdmin = await User.create({
    fullName: 'Wolkite University System Administrator',
    universityId: 'WKU-ADMIN-0001',
    email: adminEmail,
    password: adminPassword,
    role: ROLES.SUPER_ADMIN,
    status: USER_STATUS.APPROVED,
    campusId: campuses.main._id,
  });

  console.log('  - super_admin created:', adminEmail);

  // ---- 4. One campus_admin per sub-campus (handy for testing scoped permissions) ----
  console.log('Creating sample campus_admin accounts for each sub-campus...');

  const campusAdmins = [
    { campus: campuses.engineering, idSuffix: 'ENG' },
    { campus: campuses.butajira, idSuffix: 'BUT' },
    { campus: campuses.medicine, idSuffix: 'MED' },
  ];

  for (const ca of campusAdmins) {
    const slug = ca.campus.name.toLowerCase().replace(/[^a-z]+/g, '');
    await User.create({
      fullName: `${ca.campus.name} Administrator`,
      universityId: `WKU-ADMIN-${ca.idSuffix}`,
      email: `admin.${ca.idSuffix.toLowerCase()}@wolkiteuniversity.edu.et`,
      password: adminPassword,
      role: ROLES.CAMPUS_ADMIN,
      status: USER_STATUS.APPROVED,
      campusId: ca.campus._id,
    });
    console.log(`  - campus_admin created for ${ca.campus.name}`);
  }

  console.log('\nSeed complete!');
  console.log('-----------------------------------------');
  console.log('Login as Main Campus super_admin:');
  console.log('  email:   ', adminEmail);
  console.log('  password: the value supplied via SEED_SUPERADMIN_PASSWORD');
  console.log('-----------------------------------------');
  console.log('Sub-campus admins use the same password, with emails like:');
  console.log('  admin.eng@wolkiteuniversity.edu.et (Engineering)');
  console.log('  admin.but@wolkiteuniversity.edu.et (Butajira Social Science)');
  console.log('  admin.med@wolkiteuniversity.edu.et (Medicine and Health)');
  console.log('-----------------------------------------');
  console.log('IMPORTANT: change these passwords after first login in a real deployment.');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
