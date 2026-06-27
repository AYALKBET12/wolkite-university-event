const asyncHandler = require('express-async-handler');
const { Research, Department } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { ROLES, APPROVAL_STATUS } = require('../config/constants');

const MODERATORS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

// @route   POST /api/research
// @access  Any authenticated user (students included) - always starts pending
const createResearch = asyncHandler(async (req, res) => {
  const { title, abstractText, keywords, fileUrl, coAuthors, departmentId, publishedYear } = req.body;

  if (!title || !abstractText) throw new AppError(400, 'title and abstractText are required');

  const effectiveDepartmentId = departmentId || req.user.departmentId;
  if (!effectiveDepartmentId) throw new AppError(400, 'departmentId is required');

  const department = await Department.findById(effectiveDepartmentId);
  if (!department) throw new AppError(404, 'Department not found');

  if (req.campusScope && String(department.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only submit research within your own campus');
  }

  // Moderators publishing on behalf of others can set status directly;
  // everyone else (notably students) is always forced to pending.
  const isModerator = MODERATORS.includes(req.user.role);
  const status = isModerator && req.body.status ? req.body.status : APPROVAL_STATUS.PENDING;

  const research = await Research.create({
    title,
    abstractText,
    keywords: keywords || [],
    fileUrl,
    authorId: req.user._id,
    coAuthors: coAuthors || [],
    departmentId: effectiveDepartmentId,
    campusId: department.campusId,
    publishedYear,
    status,
    reviewedBy: isModerator && status !== APPROVAL_STATUS.PENDING ? req.user._id : null,
    reviewedAt: isModerator && status !== APPROVAL_STATUS.PENDING ? new Date() : null,
  });

  return sendSuccess(res, 201, 'Research submitted. It will be visible once approved', { research });
});

// @route   GET /api/research?status=&departmentId=&mine=true
const getResearch = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.campusScope) filter.campusId = req.campusScope;
  else if (req.query.campusId) filter.campusId = req.query.campusId;

  if (req.query.departmentId) filter.departmentId = req.query.departmentId;

  if (req.query.mine === 'true') {
    filter.authorId = req.user._id;
  } else if (!MODERATORS.includes(req.user.role)) {
    // Non-moderators viewing the general list only ever see approved research,
    // unless they're looking at their own ("mine=true" handled above).
    filter.status = APPROVAL_STATUS.APPROVED;
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const [research, total] = await Promise.all([
    Research.find(filter)
      .populate('authorId', 'fullName role')
      .populate('departmentId', 'name')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Research.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Research fetched', {
    research,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @route   GET /api/research/:id
const getResearchById = asyncHandler(async (req, res) => {
  const research = await Research.findById(req.params.id)
    .populate('authorId', 'fullName role')
    .populate('departmentId', 'name')
    .populate('reviewedBy', 'fullName');

  if (!research) throw new AppError(404, 'Research not found');

  const isOwner = String(research.authorId._id) === String(req.user._id);
  const isModerator = MODERATORS.includes(req.user.role);

  if (research.status !== APPROVAL_STATUS.APPROVED && !isOwner && !isModerator) {
    throw new AppError(403, 'This research has not been approved yet');
  }

  return sendSuccess(res, 200, 'Research fetched', { research });
});

// @route   PUT /api/research/:id  (content edits by owner/moderator)
const updateResearch = asyncHandler(async (req, res) => {
  const research = await Research.findById(req.params.id);
  if (!research) throw new AppError(404, 'Research not found');

  const isOwner = String(research.authorId) === String(req.user._id);
  const isModerator = MODERATORS.includes(req.user.role);

  if (!isOwner && !isModerator) throw new AppError(403, 'You can only edit research you submitted');
  if (req.campusScope && String(research.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only edit research within your own campus');
  }

  const fields = ['title', 'abstractText', 'keywords', 'fileUrl', 'coAuthors', 'publishedYear'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) research[f] = req.body[f];
  });

  // Editing content after approval resets it to pending for re-review,
  // unless a moderator is the one making the edit.
  if (isOwner && !isModerator && research.status === APPROVAL_STATUS.APPROVED) {
    research.status = APPROVAL_STATUS.PENDING;
    research.reviewedBy = null;
    research.reviewedAt = null;
  }

  await research.save();

  return sendSuccess(res, 200, 'Research updated successfully', { research });
});

// @route   PATCH /api/research/:id/review  (approve/reject)
// @access  staff, dept_head, campus_admin, super_admin
const reviewResearch = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (![APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED].includes(status)) {
    throw new AppError(400, 'status must be "approved" or "rejected"');
  }

  const research = await Research.findById(req.params.id);
  if (!research) throw new AppError(404, 'Research not found');

  if (req.campusScope && String(research.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only review research within your own campus');
  }
  if ([ROLES.DEPT_HEAD, ROLES.STAFF].includes(req.user.role)) {
    if (String(research.departmentId) !== String(req.user.departmentId)) {
      throw new AppError(403, 'You can only review research from your own department');
    }
  }

  research.status = status;
  research.reviewedBy = req.user._id;
  research.reviewedAt = new Date();
  research.rejectionReason = status === APPROVAL_STATUS.REJECTED ? rejectionReason || 'Not specified' : null;

  await research.save();

  return sendSuccess(res, 200, `Research ${status}`, { research });
});

// @route   DELETE /api/research/:id
const deleteResearch = asyncHandler(async (req, res) => {
  const research = await Research.findById(req.params.id);
  if (!research) throw new AppError(404, 'Research not found');

  const isOwner = String(research.authorId) === String(req.user._id);
  const isModerator = MODERATORS.includes(req.user.role);

  if (!isOwner && !isModerator) throw new AppError(403, 'You can only delete research you submitted');
  if (req.campusScope && String(research.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only delete research within your own campus');
  }

  await research.deleteOne();

  return sendSuccess(res, 200, 'Research deleted successfully');
});

module.exports = {
  createResearch,
  getResearch,
  getResearchById,
  updateResearch,
  reviewResearch,
  deleteResearch,
};
