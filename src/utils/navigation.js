import {
  LayoutDashboard,
  Bell,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  FlaskConical,
  Briefcase,
  Building2,
  Users,
  CloudSun,
} from 'lucide-react';
import { ROLES } from './constants';

const { SUPER_ADMIN, CAMPUS_ADMIN, DEPT_HEAD, STAFF, STUDENT } = ROLES;
const ALL_ROLES = [SUPER_ADMIN, CAMPUS_ADMIN, DEPT_HEAD, STAFF, STUDENT];
const STAFF_AND_UP = [SUPER_ADMIN, CAMPUS_ADMIN, DEPT_HEAD, STAFF];
const ADMIN_ROLES = [SUPER_ADMIN, CAMPUS_ADMIN];

// Single source of truth for sidebar nav + route guarding.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
  { to: '/notices', label: 'Notices', icon: Bell, roles: ALL_ROLES },
  { to: '/events', label: 'Events', icon: CalendarDays, roles: ALL_ROLES },
  { to: '/schedules', label: 'Schedules', icon: ClipboardList, roles: ALL_ROLES },
  { to: '/exams', label: 'Exams', icon: GraduationCap, roles: ALL_ROLES },
  { to: '/research', label: 'Research', icon: FlaskConical, roles: ALL_ROLES },
  { to: '/opportunities', label: 'Internships & Jobs', icon: Briefcase, roles: ALL_ROLES },
  { to: '/weather', label: 'Weather', icon: CloudSun, roles: ALL_ROLES },
  { to: '/organization', label: 'Campuses & Departments', icon: Building2, roles: ADMIN_ROLES },
  { to: '/users', label: 'User Approvals', icon: Users, roles: [SUPER_ADMIN, CAMPUS_ADMIN, DEPT_HEAD] },
];

export { ALL_ROLES, STAFF_AND_UP, ADMIN_ROLES };
