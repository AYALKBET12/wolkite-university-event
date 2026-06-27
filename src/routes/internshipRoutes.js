const express = require('express');
const router = express.Router();
const {
  createInternship,
  getInternships,
  getInternshipById,
  updateInternship,
  reviewInternship,
  deleteInternship,
} = require('../controllers/internshipController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ROLES } = require('../config/constants');

const MODERATORS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

router.use(protect, applyCampusScope);

router.post('/', createInternship); // any authenticated user, including students
router.get('/', getInternships);
router.get('/:id', getInternshipById);
router.put('/:id', updateInternship);
router.patch('/:id/review', authorize(...MODERATORS), reviewInternship);
router.delete('/:id', deleteInternship);

module.exports = router;
