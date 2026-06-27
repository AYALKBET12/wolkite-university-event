const asyncHandler = require('express-async-handler');
const { Event, Department, College } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { ROLES, VISIBILITY, EVENT_STATUS } = require('../config/constants');

// Roles that may create events scoped beyond their own department
// (campus-wide / university-wide visibility).
const BROAD_VISIBILITY_ROLES = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD];

// @route   POST /api/events
// @access  staff, dept_head, campus_admin, super_admin (students do not create events)
const createEvent = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    startsAt,
    endsAt,
    location,
    visibility,
    bannerUrl,
    capacity,
    campusId,
    collegeId,
    departmentId,
  } = req.body;

  if (!title || !category || !startsAt || !endsAt) {
    throw new AppError(400, 'title, category, startsAt, and endsAt are required');
  }

  // Determine the effective campus: admins can target other campuses they
  // manage, everyone else is locked to their own.
  const effectiveCampusId = req.campusScope ? req.campusScope : campusId || req.user.campusId;

  if (!effectiveCampusId) throw new AppError(400, 'campusId is required');

  let effectiveVisibility = visibility || VISIBILITY.DEPARTMENT_ONLY;
  if (!BROAD_VISIBILITY_ROLES.includes(req.user.role)) {
    // staff can only post department-level events, not campus/university-wide
    effectiveVisibility = VISIBILITY.DEPARTMENT_ONLY;
  }

  const effectiveDepartmentId =
    effectiveVisibility === VISIBILITY.DEPARTMENT_ONLY
      ? departmentId || req.user.departmentId
      : departmentId || null;

  if (effectiveVisibility === VISIBILITY.DEPARTMENT_ONLY && !effectiveDepartmentId) {
    throw new AppError(400, 'departmentId is required for department-only events');
  }

  const event = await Event.create({
    title,
    description,
    category,
    startsAt,
    endsAt,
    location,
    visibility: effectiveVisibility,
    bannerUrl,
    capacity,
    createdBy: req.user._id,
    campusId: effectiveCampusId,
    collegeId: collegeId || null,
    departmentId: effectiveDepartmentId,
  });

  return sendSuccess(res, 201, 'Event created successfully', { event });
});

// @route   GET /api/events?category=&campusId=&departmentId=&from=&to=&status=
// @access  Any authenticated user - visibility rules applied
const getEvents = asyncHandler(async (req, res) => {
  const { category, status, from, to, departmentId, collegeId } = req.query;

  const filter = {};

  if (req.campusScope) {
    filter.campusId = req.campusScope;
  } else if (req.query.campusId) {
    filter.campusId = req.query.campusId;
  }

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (departmentId) filter.departmentId = departmentId;
  if (collegeId) filter.collegeId = collegeId;

  if (from || to) {
    filter.startsAt = {};
    if (from) filter.startsAt.$gte = new Date(from);
    if (to) filter.startsAt.$lte = new Date(to);
  }

  // Students/staff without broad-visibility roles only see events relevant
  // to them: university-wide, their campus-wide, their college-wide, or
  // their own department's events. Admin-level roles see everything in scope.
  if (!BROAD_VISIBILITY_ROLES.includes(req.user.role)) {
    filter.$or = [
      { visibility: VISIBILITY.UNIVERSITY_WIDE },
      { visibility: VISIBILITY.CAMPUS_WIDE, campusId: req.user.campusId },
      { visibility: VISIBILITY.COLLEGE_WIDE, collegeId: req.user.collegeId },
      { visibility: VISIBILITY.DEPARTMENT_ONLY, departmentId: req.user.departmentId },
    ];
    // campusId filter above would conflict with $or - remove it so $or governs visibility instead
    delete filter.campusId;
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('createdBy', 'fullName role')
      .populate('campusId', 'name')
      .populate('departmentId', 'name')
      .sort({ startsAt: 1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Events fetched', {
    events,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @route   GET /api/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('createdBy', 'fullName role')
    .populate('campusId', 'name')
    .populate('collegeId', 'name')
    .populate('departmentId', 'name');

  if (!event) throw new AppError(404, 'Event not found');

  return sendSuccess(res, 200, 'Event fetched', { event });
});

// @route   PUT /api/events/:id
// @access  Creator, dept_head (own dept), campus_admin (own campus), super_admin
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError(404, 'Event not found');

  const isOwner = String(event.createdBy) === String(req.user._id);
  const isPrivileged = BROAD_VISIBILITY_ROLES.includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    throw new AppError(403, 'You can only edit events you created');
  }

  if (req.campusScope && String(event.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only edit events within your own campus');
  }

  const fields = [
    'title',
    'description',
    'category',
    'startsAt',
    'endsAt',
    'location',
    'bannerUrl',
    'capacity',
    'status',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) event[f] = req.body[f];
  });

  // Only privileged roles can widen visibility / move event between departments
  if (isPrivileged) {
    if (req.body.visibility !== undefined) event.visibility = req.body.visibility;
    if (req.body.departmentId !== undefined) event.departmentId = req.body.departmentId;
    if (req.body.collegeId !== undefined) event.collegeId = req.body.collegeId;
  }

  await event.save();

  return sendSuccess(res, 200, 'Event updated successfully', { event });
});

// @route   DELETE /api/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError(404, 'Event not found');

  const isOwner = String(event.createdBy) === String(req.user._id);
  const isPrivileged = BROAD_VISIBILITY_ROLES.includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    throw new AppError(403, 'You can only delete events you created');
  }

  if (req.campusScope && String(event.campusId) !== String(req.campusScope)) {
    throw new AppError(403, 'You can only delete events within your own campus');
  }

  await event.deleteOne();

  return sendSuccess(res, 200, 'Event deleted successfully');
});

module.exports = { createEvent, getEvents, getEventById, updateEvent, deleteEvent };
