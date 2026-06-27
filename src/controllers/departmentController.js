const asyncHandler = require('express-async-handler');
const { Department, College, User, Event, Schedule, Exam } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

// @route   GET /api/departments/public?collegeId=...
// @access  Public (no auth) - used by the registration form
const getPublicDepartments = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.collegeId) filter.collegeId = req.query.collegeId;
  if (req.query.campusId) filter.campusId = req.query.campusId;

  const departments = await Department.find(filter).select('name collegeId campusId').sort({ name: 1 });

  return sendSuccess(res, 200, 'Departments fetched', { departments });
});

// @route   POST /api/departments
// @access  super_admin or campus_admin (own campus only)
const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, collegeId, description } = req.body;

  if (!name || !collegeId) throw new AppError(400, 'name and collegeId are required');

  const college = await College.findById(collegeId);
  if (!college) throw new AppError(404, 'College not found');

  if (req.campusScope && String(college.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only create departments within your own campus');
  }

  const department = await Department.create({
    name,
    code,
    collegeId,
    campusId: college.campusId,
    description,
  });

  return sendSuccess(res, 201, 'Department created successfully', { department });
});

// @route   GET /api/departments?collegeId=...&campusId=...
const getDepartments = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.campusScope) {
    filter.campusId = req.campusScope;
  } else if (req.query.campusId) {
    filter.campusId = req.query.campusId;
  }

  if (req.query.collegeId) filter.collegeId = req.query.collegeId;

  const departments = await Department.find(filter)
    .populate('collegeId', 'name')
    .populate('campusId', 'name type')
    .sort({ name: 1 });

  return sendSuccess(res, 200, 'Departments fetched', { departments, count: departments.length });
});

// @route   GET /api/departments/:id
const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id)
    .populate('collegeId', 'name')
    .populate('campusId', 'name type');

  if (!department) throw new AppError(404, 'Department not found');

  if (req.campusScope && String(department.campusId._id) !== String(req.campusScope)) {
    throw new AppError(403, 'You do not have access to this department');
  }

  return sendSuccess(res, 200, 'Department fetched', { department });
});

// @route   PUT /api/departments/:id
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new AppError(404, 'Department not found');

  if (req.campusScope && String(department.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only update departments within your own campus');
  }

  const { name, code, description, isActive } = req.body;
  if (name) department.name = name;
  if (code !== undefined) department.code = code;
  if (description !== undefined) department.description = description;
  if (isActive !== undefined) department.isActive = isActive;

  await department.save();

  return sendSuccess(res, 200, 'Department updated successfully', { department });
});

// @route   DELETE /api/departments/:id
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new AppError(404, 'Department not found');

  if (req.campusScope && String(department.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only delete departments within your own campus');
  }

  const [userCount, eventCount, scheduleCount, examCount] = await Promise.all([
    User.countDocuments({ departmentId: department._id }),
    Event.countDocuments({ departmentId: department._id }),
    Schedule.countDocuments({ departmentId: department._id }),
    Exam.countDocuments({ departmentId: department._id }),
  ]);

  const totalDependents = userCount + eventCount + scheduleCount + examCount;
  if (totalDependents > 0) {
    throw new AppError(
      409,
      `Cannot delete department: it has ${userCount} user(s), ${eventCount} event(s), ${scheduleCount} schedule(s), ${examCount} exam(s) attached`
    );
  }

  await department.deleteOne();

  return sendSuccess(res, 200, 'Department deleted successfully');
});

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getPublicDepartments,
};
