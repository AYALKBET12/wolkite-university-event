const asyncHandler = require('express-async-handler');
const { Schedule, Department } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { ROLES } = require('../config/constants');

const SCHEDULE_MANAGERS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

// @route   POST /api/schedules
const createSchedule = asyncHandler(async (req, res) => {
  const { courseName, courseCode, instructor, dayOfWeek, startTime, endTime, room, semester, departmentId } =
    req.body;

  if (!courseName || !dayOfWeek || !startTime || !endTime || !departmentId) {
    throw new AppError(400, 'courseName, dayOfWeek, startTime, endTime, and departmentId are required');
  }

  const department = await Department.findById(departmentId);
  if (!department) throw new AppError(404, 'Department not found');

  if (req.campusScope && String(department.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only create schedules within your own campus');
  }

  // dept_head/staff are restricted to their own department
  if ([ROLES.DEPT_HEAD, ROLES.STAFF].includes(req.user.role)) {
    if (String(departmentId) !== String(req.user.departmentId)) {
      throw new AppError(403, 'You can only create schedules for your own department');
    }
  }

  if (startTime >= endTime) {
    throw new AppError(400, 'startTime must be before endTime');
  }

  const schedule = await Schedule.create({
    courseName,
    courseCode,
    instructor: instructor || null,
    dayOfWeek,
    startTime,
    endTime,
    room,
    semester,
    departmentId,
    campusId: department.campusId,
    createdBy: req.user._id,
  });

  return sendSuccess(res, 201, 'Schedule created successfully', { schedule });
});

// @route   GET /api/schedules?departmentId=&dayOfWeek=
const getSchedules = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.campusScope) filter.campusId = req.campusScope;
  else if (req.query.campusId) filter.campusId = req.query.campusId;

  // Students/staff without department override default to their own department
  if (req.query.departmentId) {
    filter.departmentId = req.query.departmentId;
  } else if (![ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN].includes(req.user.role) && req.user.departmentId) {
    filter.departmentId = req.user.departmentId;
  }

  if (req.query.dayOfWeek) filter.dayOfWeek = req.query.dayOfWeek;

  const schedules = await Schedule.find(filter)
    .populate('instructor', 'fullName')
    .populate('departmentId', 'name')
    .sort({ dayOfWeek: 1, startTime: 1 });

  return sendSuccess(res, 200, 'Schedules fetched', { schedules, count: schedules.length });
});

// @route   GET /api/schedules/:id
const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id)
    .populate('instructor', 'fullName')
    .populate('departmentId', 'name');
  if (!schedule) throw new AppError(404, 'Schedule not found');
  return sendSuccess(res, 200, 'Schedule fetched', { schedule });
});

// @route   PUT /api/schedules/:id
const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw new AppError(404, 'Schedule not found');

  if (req.campusScope && String(schedule.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only edit schedules within your own campus');
  }
  if ([ROLES.DEPT_HEAD, ROLES.STAFF].includes(req.user.role)) {
    if (String(schedule.departmentId) !== String(req.user.departmentId)) {
      throw new AppError(403, 'You can only edit schedules for your own department');
    }
  }

  const fields = ['courseName', 'courseCode', 'instructor', 'dayOfWeek', 'startTime', 'endTime', 'room', 'semester'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) schedule[f] = req.body[f];
  });

  if (schedule.startTime >= schedule.endTime) {
    throw new AppError(400, 'startTime must be before endTime');
  }

  await schedule.save();

  return sendSuccess(res, 200, 'Schedule updated successfully', { schedule });
});

// @route   DELETE /api/schedules/:id
const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw new AppError(404, 'Schedule not found');

  if (req.campusScope && String(schedule.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only delete schedules within your own campus');
  }
  if ([ROLES.DEPT_HEAD, ROLES.STAFF].includes(req.user.role)) {
    if (String(schedule.departmentId) !== String(req.user.departmentId)) {
      throw new AppError(403, 'You can only delete schedules for your own department');
    }
  }

  await schedule.deleteOne();

  return sendSuccess(res, 200, 'Schedule deleted successfully');
});

module.exports = { createSchedule, getSchedules, getScheduleById, updateSchedule, deleteSchedule, SCHEDULE_MANAGERS };
