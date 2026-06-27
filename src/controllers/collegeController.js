const asyncHandler = require('express-async-handler');
const { College, Campus, Department } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

// @route   GET /api/colleges/public?campusId=...
// @access  Public (no auth) - used by the registration form
const getPublicColleges = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.campusId) filter.campusId = req.query.campusId;

  const colleges = await College.find(filter).select('name campusId').sort({ name: 1 });

  return sendSuccess(res, 200, 'Colleges fetched', { colleges });
});

// @route   POST /api/colleges
// @access  super_admin (any campus) or campus_admin (own campus only)
const createCollege = asyncHandler(async (req, res) => {
  const { name, code, campusId, description } = req.body;

  if (!name || !campusId) throw new AppError(400, 'name and campusId are required');

  if (req.campusScope && String(campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only create colleges within your own campus');
  }

  const campus = await Campus.findById(campusId);
  if (!campus) throw new AppError(404, 'Campus not found');

  const college = await College.create({ name, code, campusId, description });

  return sendSuccess(res, 201, 'College created successfully', { college });
});

// @route   GET /api/colleges?campusId=...
const getColleges = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.campusScope) {
    filter.campusId = req.campusScope;
  } else if (req.query.campusId) {
    filter.campusId = req.query.campusId;
  }

  const colleges = await College.find(filter).populate('campusId', 'name type').sort({ name: 1 });

  return sendSuccess(res, 200, 'Colleges fetched', { colleges, count: colleges.length });
});

// @route   GET /api/colleges/:id
const getCollegeById = asyncHandler(async (req, res) => {
  const college = await College.findById(req.params.id).populate('campusId', 'name type');
  if (!college) throw new AppError(404, 'College not found');

  if (req.campusScope && String(college.campusId._id) !== String(req.campusScope)) {
    throw new AppError(403, 'You do not have access to this college');
  }

  return sendSuccess(res, 200, 'College fetched', { college });
});

// @route   PUT /api/colleges/:id
const updateCollege = asyncHandler(async (req, res) => {
  const college = await College.findById(req.params.id);
  if (!college) throw new AppError(404, 'College not found');

  if (req.campusScope && String(college.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only update colleges within your own campus');
  }

  const { name, code, description, isActive } = req.body;
  if (name) college.name = name;
  if (code !== undefined) college.code = code;
  if (description !== undefined) college.description = description;
  if (isActive !== undefined) college.isActive = isActive;

  await college.save();

  return sendSuccess(res, 200, 'College updated successfully', { college });
});

// @route   DELETE /api/colleges/:id
const deleteCollege = asyncHandler(async (req, res) => {
  const college = await College.findById(req.params.id);
  if (!college) throw new AppError(404, 'College not found');

  if (req.campusScope && String(college.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only delete colleges within your own campus');
  }

  const deptCount = await Department.countDocuments({ collegeId: college._id });
  if (deptCount > 0) {
    throw new AppError(409, `Cannot delete college: it still has ${deptCount} department(s). Remove them first`);
  }

  await college.deleteOne();

  return sendSuccess(res, 200, 'College deleted successfully');
});

module.exports = { createCollege, getColleges, getCollegeById, updateCollege, deleteCollege, getPublicColleges };
