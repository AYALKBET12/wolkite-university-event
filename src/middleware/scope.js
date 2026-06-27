const { ROLES } = require('../config/constants');

/**
 * Attaches req.campusScope to the request:
 *   - null            => no restriction (super_admin sees everything)
 *   - an ObjectId      => restricted to that single campus (campus_admin, dept_head, staff, student)
 *
 * Controllers should merge this into their Mongo filter, e.g.:
 *   const filter = {};
 *   if (req.campusScope) filter.campusId = req.campusScope;
 *
 * This must run AFTER `protect` (needs req.user).
 */
function applyCampusScope(req, res, next) {
  if (req.user.role === ROLES.SUPER_ADMIN) {
    req.campusScope = null; // main campus admin: unrestricted
  } else {
    req.campusScope = req.user.campusId;
  }
  next();
}

/**
 * Attaches req.departmentScope for roles that should only see their own
 * department's data (dept_head, staff, student creating their own content).
 * Use on top of applyCampusScope where department-level narrowing is needed.
 */
function applyDepartmentScope(req, res, next) {
  if ([ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN].includes(req.user.role)) {
    req.departmentScope = null; // can see all departments within their campus scope
  } else {
    req.departmentScope = req.user.departmentId;
  }
  next();
}

module.exports = { applyCampusScope, applyDepartmentScope };
