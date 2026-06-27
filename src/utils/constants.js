export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CAMPUS_ADMIN: 'campus_admin',
  DEPT_HEAD: 'dept_head',
  STAFF: 'staff',
  STUDENT: 'student',
};

export const ROLE_LABELS = {
  super_admin: 'Main Campus Admin',
  campus_admin: 'Campus Admin',
  dept_head: 'Department Head',
  staff: 'Staff',
  student: 'Student',
};

export const SELF_REGISTERABLE_ROLES = [ROLES.STUDENT, ROLES.STAFF, ROLES.DEPT_HEAD];

export const EVENT_CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'exam', label: 'Exam' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'tech', label: 'Tech' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'internship_fair', label: 'Internship Fair' },
  { value: 'research_event', label: 'Research Event' },
  { value: 'other', label: 'Other' },
];

// Maps each category to a CSS variable defined in index.css (noticeboard tag color)
export const CATEGORY_COLOR_VAR = {
  academic: '--color-cat-academic',
  exam: '--color-cat-exam',
  administrative: '--color-cat-admin',
  tech: '--color-cat-tech',
  entertainment: '--color-cat-entertainment',
  sports: '--color-cat-sports',
  internship_fair: '--color-cat-internship',
  research_event: '--color-cat-research',
  other: '--color-cat-admin',
};

export const VISIBILITY_OPTIONS = [
  { value: 'university_wide', label: 'University-wide (all campuses)' },
  { value: 'campus_wide', label: 'Campus-wide' },
  { value: 'college_wide', label: 'College-wide' },
  { value: 'department_only', label: 'Department only' },
];

export const NOTICE_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const INTERNSHIP_TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'job', label: 'Job' },
  { value: 'volunteer', label: 'Volunteer' },
];

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};
