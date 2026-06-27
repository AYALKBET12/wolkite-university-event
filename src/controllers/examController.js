const asyncHandler = require('express-async-handler');
const { Exam, Department } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { ROLES } = require('../config/constants');

// @route   POST /api/exams
const createExam = asyncHandler(async (req, res) => {
  const { courseName, courseCode, examType, examDate, startTime, endTime, room, instructor, departmentId, notes } =
    req.body;

  if (!courseName || !examDate || !departmentId) {
    throw new AppError(400, 'courseName, examDate, and departmentId are required');
  }

  const department = await Department.findById(departmentId);
  if (!department) throw new AppError(404, 'Department not found');

  if (req.campusScope && String(department.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only create exams within your own campus');
  }
  if ([ROLES.DEPT_HEAD, ROLES.STAFF].includes(req.user.role)) {
    if (String(departmentId) !== String(req.user.departmentId)) {
      throw new AppError(403, 'You can only create exams for your own department');
    }
  }

  const exam = await Exam.create({
    courseName,
    courseCode,
    examType,
    examDate,
    startTime,
    endTime,
    room,
    instructor: instructor || null,
    departmentId,
    campusId: department.campusId,
    createdBy: req.user._id,
    notes,
  });

  return sendSuccess(res, 201, 'Exam scheduled successfully', { exam });
});

// @route   GET /api/exams?departmentId=&from=&to=
const getExams = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.campusScope) filter.campusId = req.campusScope;
  else if (req.query.campusId) filter.campusId = req.query.campusId;

  if (req.query.departmentId) {
    filter.departmentId = req.query.departmentId;
  } else if (![ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN].includes(req.user.role) && req.user.departmentId) {
    filter.departmentId = req.user.departmentId;
  }

  if (req.query.from || req.query.to) {
    filter.examDate = {};
    if (req.query.from) filter.examDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.examDate.$lte = new Date(req.query.to);
  }

  const exams = await Exam.find(filter)
    .populate('instructor', 'fullName')
    .populate('departmentId', 'name')
    .sort({ examDate: 1 });

  return sendSuccess(res, 200, 'Exams fetched', { exams, count: exams.length });
});

// @route   GET /api/exams/:id
const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('instructor', 'fullName').populate('departmentId', 'name');
  if (!exam) throw new AppError(404, 'Exam not found');
  return sendSuccess(res, 200, 'Exam fetched', { exam });
});

// @route   PUT /api/exams/:id
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new AppError(404, 'Exam not found');

  if (req.campusScope && String(exam.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only edit exams within your own campus');
  }
  if ([ROLES.DEPT_HEAD, ROLES.STAFF].includes(req.user.role)) {
    if (String(exam.departmentId) !== String(req.user.departmentId)) {
      throw new AppError(403, 'You can only edit exams for your own department');
    }
  }

  const fields = ['courseName', 'courseCode', 'examType', 'examDate', 'startTime', 'endTime', 'room', 'instructor', 'notes'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) exam[f] = req.body[f];
  });

  await exam.save();

  return sendSuccess(res, 200, 'Exam updated successfully', { exam });
});

// @route   DELETE /api/exams/:id
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new AppError(404, 'Exam not found');

  if (req.campusScope && String(exam.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only delete exams within your own campus');
  }
  if ([ROLES.DEPT_HEAD, ROLES.STAFF].includes(req.user.role)) {
    if (String(exam.departmentId) !== String(req.user.departmentId)) {
      throw new AppError(403, 'You can only delete exams for your own department');
    }
  }

  await exam.deleteOne();

  return sendSuccess(res, 200, 'Exam deleted successfully');
});

module.exports = { createExam, getExams, getExamById, updateExam, deleteExam };
