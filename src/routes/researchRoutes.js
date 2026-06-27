const express = require('express');
const router = express.Router();
const {
  createResearch,
  getResearch,
  getResearchById,
  updateResearch,
  reviewResearch,
  deleteResearch,
} = require('../controllers/researchController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ROLES } = require('../config/constants');

const MODERATORS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

router.use(protect, applyCampusScope);

router.post('/', createResearch); // any authenticated user, including students
router.get('/', getResearch);
router.get('/:id', getResearchById);
router.put('/:id', updateResearch); // ownership checked in controller
router.patch('/:id/review', authorize(...MODERATORS), reviewResearch);
router.delete('/:id', deleteResearch); // ownership checked in controller

module.exports = router;
