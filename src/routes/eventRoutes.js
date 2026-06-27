const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ROLES } = require('../config/constants');

router.use(protect, applyCampusScope);

router.post('/', authorize(ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF), createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.put('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF), updateEvent);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF), deleteEvent);

module.exports = router;
