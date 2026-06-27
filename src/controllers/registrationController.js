const asyncHandler = require('express-async-handler');
const { Registration, Event } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { ROLES, REGISTRATION_STATUS } = require('../config/constants');

const MODERATORS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

// @route   POST /api/registrations  { eventId }
// @access  Any authenticated user
const registerForEvent = asyncHandler(async (req, res) => {
  const { eventId, notes } = req.body;
  if (!eventId) throw new AppError(400, 'eventId is required');

  const event = await Event.findById(eventId);
  if (!event) throw new AppError(404, 'Event not found');

  if (event.status === 'cancelled') throw new AppError(400, 'Cannot register for a cancelled event');

  // Check capacity (if the event has a limit)
  if (event.capacity != null) {
    const activeCount = await Registration.countDocuments({
      eventId,
      status: REGISTRATION_STATUS.REGISTERED,
    });
    if (activeCount >= event.capacity) {
      throw new AppError(409, 'This event has reached its capacity');
    }
  }

  // If a registration already exists (e.g. previously cancelled), flip it
  // back to registered instead of creating a duplicate doc.
  let registration = await Registration.findOne({ eventId, userId: req.user._id });

  if (registration) {
    if (registration.status === REGISTRATION_STATUS.REGISTERED) {
      throw new AppError(409, 'You are already registered for this event');
    }
    registration.status = REGISTRATION_STATUS.REGISTERED;
    registration.notes = notes || registration.notes;
    await registration.save();
  } else {
    registration = await Registration.create({
      eventId,
      userId: req.user._id,
      notes,
      status: REGISTRATION_STATUS.REGISTERED,
    });
  }

  return sendSuccess(res, 201, 'Registered for event successfully', { registration });
});

// @route   GET /api/registrations?eventId=&mine=true
// @access  mine=true -> any user; full list for an event -> moderators only
const getRegistrations = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.mine === 'true') {
    filter.userId = req.user._id;
  } else if (req.query.eventId) {
    if (!MODERATORS.includes(req.user.role)) {
      throw new AppError(403, 'Only organizers/admins can view the full registration list for an event');
    }
    filter.eventId = req.query.eventId;
  } else {
    throw new AppError(400, 'Provide eventId or mine=true');
  }

  if (req.query.status) filter.status = req.query.status;

  const registrations = await Registration.find(filter)
    .populate('eventId', 'title startsAt location')
    .populate('userId', 'fullName email role')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 200, 'Registrations fetched', { registrations, count: registrations.length });
});

// @route   PATCH /api/registrations/:id/cancel
// @access  Owner only
const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id);
  if (!registration) throw new AppError(404, 'Registration not found');

  if (String(registration.userId) !== String(req.user._id)) {
    throw new AppError(403, 'You can only cancel your own registration');
  }

  registration.status = REGISTRATION_STATUS.CANCELLED;
  await registration.save();

  return sendSuccess(res, 200, 'Registration cancelled', { registration });
});

// @route   PATCH /api/registrations/:id/attend
// @access  Moderators only - marks attendance at the event
const markAttended = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id);
  if (!registration) throw new AppError(404, 'Registration not found');

  registration.status = REGISTRATION_STATUS.ATTENDED;
  await registration.save();

  return sendSuccess(res, 200, 'Attendance marked', { registration });
});

// @route   DELETE /api/registrations/:id
// @access  Owner or moderator
const deleteRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id);
  if (!registration) throw new AppError(404, 'Registration not found');

  const isOwner = String(registration.userId) === String(req.user._id);
  if (!isOwner && !MODERATORS.includes(req.user.role)) {
    throw new AppError(403, 'You do not have permission to delete this registration');
  }

  await registration.deleteOne();

  return sendSuccess(res, 200, 'Registration deleted successfully');
});

module.exports = {
  registerForEvent,
  getRegistrations,
  cancelRegistration,
  markAttended,
  deleteRegistration,
};
