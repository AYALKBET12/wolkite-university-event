import { ROLES } from './constants';

export function canManageContent(role) {
  return [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF].includes(role);
}

export function canManageOrg(role) {
  return [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN].includes(role);
}

export function canModerate(role) {
  return [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF].includes(role);
}

export function isOwner(item, ownerField, userId) {
  const ownerValue = item[ownerField];
  const ownerId = ownerValue?._id || ownerValue;
  return String(ownerId) === String(userId);
}
