const { Campus, College, Department } = require('../models');
const { CAMPUS_TYPES } = require('../config/constants');

const campusDefinitions = [
  {
    key: 'main',
    name: 'Wolkite University Main Campus',
    type: CAMPUS_TYPES.MAIN,
    location: 'Wolkite, Gurage Zone, Central Ethiopia Regional State',
    latitude: 8.2833,
    longitude: 37.7833,
    contactEmail: 'info@wolkiteuniversity.edu.et',
  },
  {
    key: 'engineering',
    name: 'Wolkite Engineering Sub-Campus',
    type: CAMPUS_TYPES.SUB,
    parentKey: 'main',
    location: 'Wolkite, Gurage Zone, Central Ethiopia Regional State',
    latitude: 8.2833,
    longitude: 37.7833,
    contactEmail: 'engineering@wolkiteuniversity.edu.et',
  },
  {
    key: 'butajira',
    name: 'Butajira Social Science Sub-Campus',
    type: CAMPUS_TYPES.SUB,
    parentKey: 'main',
    location: 'Butajira, Gurage Zone, Central Ethiopia Regional State',
    latitude: 8.1168,
    longitude: 38.3745,
    contactEmail: 'butajira@wolkiteuniversity.edu.et',
  },
  {
    key: 'medicine',
    name: 'Medicine and Health Sub-Campus',
    type: CAMPUS_TYPES.SUB,
    parentKey: 'main',
    location: 'Wolkite, Gurage Zone, Central Ethiopia Regional State',
    latitude: 8.2833,
    longitude: 37.7833,
    contactEmail: 'health@wolkiteuniversity.edu.et',
  },
];

const collegeDefinitions = [
  {
    campusKey: 'main',
    college: { name: 'College of Business and Economics', code: 'CBE' },
    departments: [
      { name: 'Department of Management', code: 'MGT' },
      { name: 'Department of Economics', code: 'ECON' },
    ],
  },
  {
    campusKey: 'engineering',
    college: { name: 'College of Engineering and Technology', code: 'CET' },
    departments: [
      { name: 'Department of Software Engineering', code: 'SWE' },
      { name: 'Department of Electrical Engineering', code: 'EE' },
    ],
  },
  {
    campusKey: 'butajira',
    college: { name: 'College of Social Sciences and Humanities', code: 'CSSH' },
    departments: [
      { name: 'Department of Sociology', code: 'SOC' },
      { name: 'Department of Political Science', code: 'POLS' },
    ],
  },
  {
    campusKey: 'medicine',
    college: { name: 'College of Medicine and Health Sciences', code: 'CMHS' },
    departments: [
      { name: 'Department of Medicine', code: 'MED' },
      { name: 'Department of Nursing', code: 'NUR' },
    ],
  },
];

async function createOrganizationStructure() {
  const campuses = {};

  for (const definition of campusDefinitions) {
    const { key, parentKey, ...campusDefinition } = definition;
    campuses[key] = await Campus.create({
      ...campusDefinition,
      parentCampusId: parentKey ? campuses[parentKey]._id : null,
    });
  }

  for (const definition of collegeDefinitions) {
    const campus = campuses[definition.campusKey];
    const college = await College.create({
      ...definition.college,
      campusId: campus._id,
    });

    for (const departmentDefinition of definition.departments) {
      await Department.create({
        ...departmentDefinition,
        collegeId: college._id,
        campusId: campus._id,
      });
    }

    console.log(`  - ${campus.name}: ${college.name} (${definition.departments.length} departments)`);
  }

  return campuses;
}

async function ensureOrganizationStructure() {
  const [campusCount, collegeCount, departmentCount] = await Promise.all([
    Campus.countDocuments(),
    College.countDocuments(),
    Department.countDocuments(),
  ]);

  if (campusCount + collegeCount + departmentCount > 0) {
    console.log('Organization records already exist; skipping initial setup.');
    return;
  }

  console.log('Initializing the confirmed campus, college, and department structure...');
  await createOrganizationStructure();
}

module.exports = { createOrganizationStructure, ensureOrganizationStructure };
