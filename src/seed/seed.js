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
const { CAMPUS_TYPES, ROLES, USER_STATUS } = require('../config/constants');

async function seed() {
  await connectDB();

  console.log('Clearing existing org-structure and user data...');
  await Promise.all([
    Campus.deleteMany({}),
    College.deleteMany({}),
    Department.deleteMany({}),
    User.deleteMany({}),
  ]);

  // ---- 1. Campuses ----
  console.log('Creating campuses...');

  const mainCampus = await Campus.create({
    name: 'Wolkite University Main Campus',
    type: CAMPUS_TYPES.MAIN,
    location: 'Wolkite, Gurage Zone, Central Ethiopia Regional State',
    latitude: 8.2833,
    longitude: 37.7833,
    contactEmail: 'info@wolkiteuniversity.edu.et',
  });

  const engineeringCampus = await Campus.create({
    name: 'Wolkite Engineering Sub-Campus',
    type: CAMPUS_TYPES.SUB,
    parentCampusId: mainCampus._id,
    location: 'Wolkite, Gurage Zone, Central Ethiopia Regional State',
    latitude: 8.2833,
    longitude: 37.7833,
    contactEmail: 'engineering@wolkiteuniversity.edu.et',
  });

  const butajiraCampus = await Campus.create({
    name: 'Butajira Social Science Sub-Campus',
    type: CAMPUS_TYPES.SUB,
    parentCampusId: mainCampus._id,
    location: 'Butajira, Gurage Zone, Central Ethiopia Regional State',
    latitude: 8.1168,
    longitude: 38.3745,
    contactEmail: 'butajira@wolkiteuniversity.edu.et',
  });

  const medicineCampus = await Campus.create({
    name: 'Medicine and Health Sub-Campus',
    type: CAMPUS_TYPES.SUB,
    parentCampusId: mainCampus._id,
    location: 'Wolkite, Gurage Zone, Central Ethiopia Regional State',
    latitude: 8.2833,
    longitude: 37.7833,
    contactEmail: 'health@wolkiteuniversity.edu.et',
  });

  console.log('  - Main Campus created');
  console.log('  - 3 Sub-Campuses created (Engineering, Butajira Social Science, Medicine & Health)');

  // ---- 2. Colleges + Departments (sample structure per campus) ----
  console.log('Creating colleges and departments...');

  const orgStructure = [
    {
      campus: mainCampus,
      college: { name: 'College of Business and Economics', code: 'CBE' },
      departments: [
        { name: 'Department of Management', code: 'MGT' },
        { name: 'Department of Economics', code: 'ECON' },
      ],
    },
    {
      campus: engineeringCampus,
      college: { name: 'College of Engineering and Technology', code: 'CET' },
      departments: [
        { name: 'Department of Software Engineering', code: 'SWE' },
        { name: 'Department of Electrical Engineering', code: 'EE' },
      ],
    },
    {
      campus: butajiraCampus,
      college: { name: 'College of Social Sciences and Humanities', code: 'CSSH' },
      departments: [
        { name: 'Department of Sociology', code: 'SOC' },
        { name: 'Department of Political Science', code: 'POLS' },
      ],
    },
    {
      campus: medicineCampus,
      college: { name: 'College of Medicine and Health Sciences', code: 'CMHS' },
      departments: [
        { name: 'Department of Medicine', code: 'MED' },
        { name: 'Department of Nursing', code: 'NUR' },
      ],
    },
  ];

  const createdDepartments = [];

  for (const entry of orgStructure) {
    const college = await College.create({
      name: entry.college.name,
      code: entry.college.code,
      campusId: entry.campus._id,
    });

    for (const dept of entry.departments) {
      const department = await Department.create({
        name: dept.name,
        code: dept.code,
        collegeId: college._id,
        campusId: entry.campus._id,
      });
      createdDepartments.push(department);
    }

    console.log(`  - ${entry.campus.name}: ${entry.college.name} (${entry.departments.length} departments)`);
  }

  // ---- 3. Super Admin account (Main Campus) ----
  console.log('Creating super_admin account...');

  const adminEmail = process.env.SEED_SUPERADMIN_EMAIL || 'admin@wolkiteuniversity.edu.et';
  const adminPassword = process.env.SEED_SUPERADMIN_PASSWORD || 'ChangeMe123!';

  const superAdmin = await User.create({
    fullName: 'Wolkite University System Administrator',
    universityId: 'WKU-ADMIN-0001',
    email: adminEmail,
    password: adminPassword,
    role: ROLES.SUPER_ADMIN,
    status: USER_STATUS.APPROVED,
    campusId: mainCampus._id,
  });

  console.log('  - super_admin created:', adminEmail);

  // ---- 4. One campus_admin per sub-campus (handy for testing scoped permissions) ----
  console.log('Creating sample campus_admin accounts for each sub-campus...');

  const campusAdmins = [
    { campus: engineeringCampus, idSuffix: 'ENG' },
    { campus: butajiraCampus, idSuffix: 'BUT' },
    { campus: medicineCampus, idSuffix: 'MED' },
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
  console.log('  password:', adminPassword);
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
