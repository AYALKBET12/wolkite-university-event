const asyncHandler = require('express-async-handler');
const { Campus, College, Department, User } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { ROLES, CAMPUS_TYPES } = require('../config/constants');

// @route   GET /api/campuses/public
// @access  Public (no auth) - used by the registration form to populate the
// campus dropdown before the user has an account. Returns only safe, minimal
// fields - no contact info, no internal flags.
const getPublicCampuses = asyncHandler(async (req, res) => {
  const campuses = await Campus.find({ isActive: true })
    .select('name type')
    .sort({ type: 1, name: 1 });

  return sendSuccess(res, 200, 'Campuses fetched', { campuses });
});

// @route   POST /api/campuses
// @access  super_admin only (only Main Campus creates new campuses)
const createCampus = asyncHandler(async (req, res) => {
  const { name, type, parentCampusId, location, latitude, longitude, contactEmail, contactPhone } = req.body;

  if (!name || !type) {
    throw new AppError(400, 'name and type are required');
  }

  if (type === CAMPUS_TYPES.SUB && !parentCampusId) {
    throw new AppError(400, 'Sub-campus requires a parentCampusId');
  }

  if (type === CAMPUS_TYPES.MAIN) {
    const existingMain = await Campus.findOne({ type: CAMPUS_TYPES.MAIN });
    if (existingMain) {
      throw new AppError(409, 'A main campus already exists. Only one main campus is allowed');
    }
  }

  const campus = await Campus.create({
    name,
    type,
    parentCampusId: type === CAMPUS_TYPES.SUB ? parentCampusId : null,
    location,
    latitude,
    longitude,
    contactEmail,
    contactPhone,
  });

  return sendSuccess(res, 201, 'Campus created successfully', { campus });
});

// @route   GET /api/campuses
// @access  Any authenticated user (read access is broad - everyone needs to see campus list)
const getCampuses = asyncHandler(async (req, res) => {
  const filter = {};

  // Non-super-admins only see their own campus (sub-campus admins/staff/students
  // don't need to browse every other campus's internal listing here).
  if (req.campusScope) {
    filter._id = req.campusScope;
  }

  const campuses = await Campus.find(filter).populate('parentCampusId', 'name type').sort({ type: 1, name: 1 });

  return sendSuccess(res, 200, 'Campuses fetched', { campuses, count: campuses.length });
});

// @route   GET /api/campuses/:id
const getCampusById = asyncHandler(async (req, res) => {
  const campus = await Campus.findById(req.params.id).populate('parentCampusId', 'name type');
  if (!campus) throw new AppError(404, 'Campus not found');

  if (req.campusScope && String(campus._id) !== String(req.campusScope)) {
    throw new AppError(403, 'You do not have access to this campus');
  }

  return sendSuccess(res, 200, 'Campus fetched', { campus });
});

// @route   PUT /api/campuses/:id
// @access  super_admin (any campus) or campus_admin (own campus only)
const updateCampus = asyncHandler(async (req, res) => {
  const campus = await Campus.findById(req.params.id);
  if (!campus) throw new AppError(404, 'Campus not found');

  if (req.campusScope && String(campus._id) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only update your own campus');
  }

  // Prevent changing type/parent through this endpoint - that's a structural
  // change that should go through a deliberate migration, not a quick edit.
  const { name, location, latitude, longitude, contactEmail, contactPhone, isActive } = req.body;

  if (name) campus.name = name;
  if (location !== undefined) campus.location = location;
  if (latitude !== undefined) campus.latitude = latitude;
  if (longitude !== undefined) campus.longitude = longitude;
  if (contactEmail !== undefined) campus.contactEmail = contactEmail;
  if (contactPhone !== undefined) campus.contactPhone = contactPhone;
  if (isActive !== undefined && req.user.role === ROLES.SUPER_ADMIN) campus.isActive = isActive;

  await campus.save();

  return sendSuccess(res, 200, 'Campus updated successfully', { campus });
});

// @route   DELETE /api/campuses/:id
// @access  super_admin only
const deleteCampus = asyncHandler(async (req, res) => {
  const campus = await Campus.findById(req.params.id);
  if (!campus) throw new AppError(404, 'Campus not found');

  if (campus.type === CAMPUS_TYPES.MAIN) {
    throw new AppError(400, 'The main campus cannot be deleted');
  }

  // Guard against orphaning data - block deletion if dependents exist.
  const [collegeCount, userCount] = await Promise.all([
    College.countDocuments({ campusId: campus._id }),
    User.countDocuments({ campusId: campus._id }),
  ]);

  if (collegeCount > 0 || userCount > 0) {
    throw new AppError(
      409,
      `Cannot delete campus: it still has ${collegeCount} college(s) and ${userCount} user(s). Reassign or remove them first`
    );
  }

  await campus.deleteOne();

  return sendSuccess(res, 200, 'Campus deleted successfully');
});

module.exports = { createCampus, getCampuses, getCampusById, updateCampus, deleteCampus, getPublicCampuses };
