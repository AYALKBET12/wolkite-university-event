// Centralized enums used across models, middleware, and controllers.
// Keeping these in one place avoids typos like "admin" vs "Admin" vs "ADMIN".

const ROLES = {
  SUPER_ADMIN: 'super_admin',   // Main Campus admin - full control over everything
  CAMPUS_ADMIN: 'campus_admin', // Sub-campus admin - scoped to their own campus
  DEPT_HEAD: 'dept_head',       // Department head - scoped to their own department
  STAFF: 'staff',               // Lecturer / staff member
  STUDENT: 'student',
};

const ROLE_LIST = Object.values(ROLES);

// Roles allowed to manage (create/update/delete) org structure (campuses/colleges/departments)
const ORG_MANAGERS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN];

// Roles allowed to approve pending users / pending research / pending internships
const APPROVERS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

const CAMPUS_TYPES = {
  MAIN: 'main',
  SUB: 'sub',
};

const EVENT_CATEGORIES = {
  ACADEMIC: 'academic',
  EXAM: 'exam',
  ADMINISTRATIVE: 'administrative',
  TECH: 'tech',
  ENTERTAINMENT: 'entertainment',
  SPORTS: 'sports',
  INTERNSHIP_FAIR: 'internship_fair',
  RESEARCH_EVENT: 'research_event',
  OTHER: 'other',
};

const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

// Who can see the event
const VISIBILITY = {
  UNIVERSITY_WIDE: 'university_wide', // all campuses
  CAMPUS_WIDE: 'campus_wide',         // one campus, all departments
  COLLEGE_WIDE: 'college_wide',
  DEPARTMENT_ONLY: 'department_only',
};

const NOTICE_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  CANCELLED: 'cancelled',
  ATTENDED: 'attended',
};

const INTERNSHIP_TYPES = {
  INTERNSHIP: 'internship',
  JOB: 'job',
  VOLUNTEER: 'volunteer',
};

module.exports = {
  ROLES,
  ROLE_LIST,
  ORG_MANAGERS,
  APPROVERS,
  USER_STATUS,
  CAMPUS_TYPES,
  EVENT_CATEGORIES,
  EVENT_STATUS,
  VISIBILITY,
  NOTICE_PRIORITY,
  APPROVAL_STATUS,
  REGISTRATION_STATUS,
  INTERNSHIP_TYPES,
};
