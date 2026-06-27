const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getRegistrations,
  cancelRegistration,
  markAttended,
  deleteRegistration,
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ROLES } = require('../config/constants');

const MODERATORS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

router.use(protect, applyCampusScope);

router.post('/', registerForEvent); // any authenticated user
router.get('/', getRegistrations); // ownership/moderator check inside controller
router.patch('/:id/cancel', cancelRegistration); // owner only, checked inside
router.patch('/:id/attend', authorize(...MODERATORS), markAttended);
router.delete('/:id', deleteRegistration); // owner or moderator, checked inside

module.exports = router;
