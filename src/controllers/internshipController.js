const asyncHandler = require('express-async-handler');
const { Internship, Department } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { ROLES, APPROVAL_STATUS } = require('../config/constants');

const MODERATORS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

// @route   POST /api/internships
// @access  Any authenticated user (students included) - always starts pending
const createInternship = asyncHandler(async (req, res) => {
  const {
    title,
    company,
    type,
    description,
    location,
    isRemote,
    applyUrl,
    contactEmail,
    deadline,
    departmentId,
  } = req.body;

  if (!title || !company || !description) {
    throw new AppError(400, 'title, company, and description are required');
  }

  const effectiveCampusId = req.campusScope || req.user.campusId;
  const effectiveDepartmentId = departmentId || null;

  if (effectiveDepartmentId) {
    const department = await Department.findById(effectiveDepartmentId);
    if (!department) throw new AppError(404, 'Department not found');
    if (req.campusScope && String(department.campusId) !== String(req.campusScope)) {
      throw new AppError(403, 'You can only post internships within your own campus');
    }
  }

  const isModerator = MODERATORS.includes(req.user.role);
  const status = isModerator && req.body.status ? req.body.status : APPROVAL_STATUS.PENDING;

  const internship = await Internship.create({
    title,
    company,
    type,
    description,
    location,
    isRemote: !!isRemote,
    applyUrl,
    contactEmail,
    deadline,
    postedBy: req.user._id,
    departmentId: effectiveDepartmentId,
    campusId: effectiveCampusId,
    status,
    reviewedBy: isModerator && status !== APPROVAL_STATUS.PENDING ? req.user._id : null,
    reviewedAt: isModerator && status !== APPROVAL_STATUS.PENDING ? new Date() : null,
  });

  return sendSuccess(res, 201, 'Internship/job posted. It will be visible once approved', { internship });
});

// @route   GET /api/internships?status=&departmentId=&mine=true&type=
const getInternships = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.campusScope) filter.campusId = req.campusScope;
  else if (req.query.campusId) filter.campusId = req.query.campusId;

  if (req.query.departmentId) filter.departmentId = req.query.departmentId;
  if (req.query.type) filter.type = req.query.type;

  if (req.query.mine === 'true') {
    filter.postedBy = req.user._id;
  } else if (!MODERATORS.includes(req.user.role)) {
    filter.status = APPROVAL_STATUS.APPROVED;
    // Hide expired postings from the general feed
    filter.$or = [{ deadline: null }, { deadline: { $gte: new Date() } }];
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const [internships, total] = await Promise.all([
    Internship.find(filter)
      .populate('postedBy', 'fullName role')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Internship.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Internships/jobs fetched', {
    internships,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @route   GET /api/internships/:id
const getInternshipById = asyncHandler(async (req, res) => {
  const internship = await Internship.findById(req.params.id)
    .populate('postedBy', 'fullName role')
    .populate('departmentId', 'name');

  if (!internship) throw new AppError(404, 'Internship/job not found');

  const isOwner = String(internship.postedBy._id) === String(req.user._id);
  const isModerator = MODERATORS.includes(req.user.role);

  if (internship.status !== APPROVAL_STATUS.APPROVED && !isOwner && !isModerator) {
    throw new AppError(403, 'This posting has not been approved yet');
  }

  return sendSuccess(res, 200, 'Internship/job fetched', { internship });
});

// @route   PUT /api/internships/:id
const updateInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findById(req.params.id);
  if (!internship) throw new AppError(404, 'Internship/job not found');

  const isOwner = String(internship.postedBy) === String(req.user._id);
  const isModerator = MODERATORS.includes(req.user.role);

  if (!isOwner && !isModerator) throw new AppError(403, 'You can only edit postings you created');
  if (req.campusScope && String(internship.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only edit postings within your own campus');
  }

  const fields = [
    'title',
    'company',
    'type',
    'description',
    'location',
    'isRemote',
    'applyUrl',
    'contactEmail',
    'deadline',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) internship[f] = req.body[f];
  });

  if (isOwner && !isModerator && internship.status === APPROVAL_STATUS.APPROVED) {
    internship.status = APPROVAL_STATUS.PENDING;
    internship.reviewedBy = null;
    internship.reviewedAt = null;
  }

  await internship.save();

  return sendSuccess(res, 200, 'Internship/job updated successfully', { internship });
});

// @route   PATCH /api/internships/:id/review
const reviewInternship = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (![APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED].includes(status)) {
    throw new AppError(400, 'status must be "approved" or "rejected"');
  }

  const internship = await Internship.findById(req.params.id);
  if (!internship) throw new AppError(404, 'Internship/job not found');

  if (req.campusScope && String(internship.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only review postings within your own campus');
  }
  if ([ROLES.DEPT_HEAD, ROLES.STAFF].includes(req.user.role) && internship.departmentId) {
    if (String(internship.departmentId) !== String(req.user.departmentId)) {
      throw new AppError(403, 'You can only review postings from your own department');
    }
  }

  internship.status = status;
  internship.reviewedBy = req.user._id;
  internship.reviewedAt = new Date();
  internship.rejectionReason = status === APPROVAL_STATUS.REJECTED ? rejectionReason || 'Not specified' : null;

  await internship.save();

  return sendSuccess(res, 200, `Internship/job ${status}`, { internship });
});

// @route   DELETE /api/internships/:id
const deleteInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findById(req.params.id);
  if (!internship) throw new AppError(404, 'Internship/job not found');

  const isOwner = String(internship.postedBy) === String(req.user._id);
  const isModerator = MODERATORS.includes(req.user.role);

  if (!isOwner && !isModerator) throw new AppError(403, 'You can only delete postings you created');
  if (req.campusScope && String(internship.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only delete postings within your own campus');
  }

  await internship.deleteOne();

  return sendSuccess(res, 200, 'Internship/job deleted successfully');
});

module.exports = {
  createInternship,
  getInternships,
  getInternshipById,
  updateInternship,
  reviewInternship,
  deleteInternship,
};
