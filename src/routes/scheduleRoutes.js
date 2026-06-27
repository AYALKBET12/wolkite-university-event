const express = require('express');
const router = express.Router();
const {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ROLES } = require('../config/constants');

const MANAGERS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

router.use(protect, applyCampusScope);

router.post('/', authorize(...MANAGERS), createSchedule);
router.get('/', getSchedules);
router.get('/:id', getScheduleById);
router.put('/:id', authorize(...MANAGERS), updateSchedule);
router.delete('/:id', authorize(...MANAGERS), deleteSchedule);

module.exports = router;
