const asyncHandler = require('express-async-handler');
const { Notice } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { ROLES, VISIBILITY } = require('../config/constants');

const BROAD_VISIBILITY_ROLES = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD];

// @route   POST /api/notices
// @access  staff, dept_head, campus_admin, super_admin
const createNotice = asyncHandler(async (req, res) => {
  const { title, body, priority, targetScope, attachmentUrl, departmentId, collegeId, expiresAt, isPinned } =
    req.body;

  if (!title || !body) throw new AppError(400, 'title and body are required');

  const effectiveCampusId = req.campusScope || req.user.campusId;

  let effectiveScope = targetScope || VISIBILITY.DEPARTMENT_ONLY;
  if (!BROAD_VISIBILITY_ROLES.includes(req.user.role)) {
    effectiveScope = VISIBILITY.DEPARTMENT_ONLY;
  }

  const effectiveDepartmentId =
    effectiveScope === VISIBILITY.DEPARTMENT_ONLY ? departmentId || req.user.departmentId : departmentId || null;

  const notice = await Notice.create({
    title,
    body,
    priority,
    targetScope: effectiveScope,
    attachmentUrl,
    postedBy: req.user._id,
    campusId: effectiveCampusId,
    collegeId: collegeId || null,
    departmentId: effectiveDepartmentId,
    expiresAt: expiresAt || null,
    isPinned: BROAD_VISIBILITY_ROLES.includes(req.user.role) ? !!isPinned : false,
  });

  return sendSuccess(res, 201, 'Notice posted successfully', { notice });
});

// @route   GET /api/notices
const getNotices = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.campusScope) filter.campusId = req.campusScope;
  else if (req.query.campusId) filter.campusId = req.query.campusId;

  if (req.query.priority) filter.priority = req.query.priority;

  // hide expired notices unless explicitly asked for via includeExpired=true
  if (req.query.includeExpired !== 'true') {
    filter.$and = [{ $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }] }];
  }

  if (!BROAD_VISIBILITY_ROLES.includes(req.user.role)) {
    const visibilityOr = [
      { targetScope: VISIBILITY.UNIVERSITY_WIDE },
      { targetScope: VISIBILITY.CAMPUS_WIDE, campusId: req.user.campusId },
      { targetScope: VISIBILITY.COLLEGE_WIDE, collegeId: req.user.collegeId },
      { targetScope: VISIBILITY.DEPARTMENT_ONLY, departmentId: req.user.departmentId },
    ];
    filter.$and = [...(filter.$and || []), { $or: visibilityOr }];
    delete filter.campusId;
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const [notices, total] = await Promise.all([
    Notice.find(filter)
      .populate('postedBy', 'fullName role')
      .sort({ isPinned: -1, priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notice.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Notices fetched', {
    notices,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @route   GET /api/notices/:id
const getNoticeById = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id).populate('postedBy', 'fullName role');
  if (!notice) throw new AppError(404, 'Notice not found');
  return sendSuccess(res, 200, 'Notice fetched', { notice });
});

// @route   PUT /api/notices/:id
const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) throw new AppError(404, 'Notice not found');

  const isOwner = String(notice.postedBy) === String(req.user._id);
  const isPrivileged = BROAD_VISIBILITY_ROLES.includes(req.user.role);

  if (!isOwner && !isPrivileged) throw new AppError(403, 'You can only edit notices you posted');
  if (req.campusScope && String(notice.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only edit notices within your own campus');
  }

  const fields = ['title', 'body', 'priority', 'attachmentUrl', 'expiresAt'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) notice[f] = req.body[f];
  });

  if (isPrivileged) {
    if (req.body.targetScope !== undefined) notice.targetScope = req.body.targetScope;
    if (req.body.isPinned !== undefined) notice.isPinned = req.body.isPinned;
    if (req.body.departmentId !== undefined) notice.departmentId = req.body.departmentId;
  }

  await notice.save();

  return sendSuccess(res, 200, 'Notice updated successfully', { notice });
});

// @route   DELETE /api/notices/:id
const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) throw new AppError(404, 'Notice not found');

  const isOwner = String(notice.postedBy) === String(req.user._id);
  const isPrivileged = BROAD_VISIBILITY_ROLES.includes(req.user.role);

  if (!isOwner && !isPrivileged) throw new AppError(403, 'You can only delete notices you posted');
  if (req.campusScope && String(notice.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only delete notices within your own campus');
  }

  await notice.deleteOne();

  return sendSuccess(res, 200, 'Notice deleted successfully');
});

module.exports = { createNotice, getNotices, getNoticeById, updateNotice, deleteNotice };
