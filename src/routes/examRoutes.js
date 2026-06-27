const express = require('express');
const router = express.Router();
const { createExam, getExams, getExamById, updateExam, deleteExam } = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ROLES } = require('../config/constants');

const MANAGERS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF];

router.use(protect, applyCampusScope);

router.post('/', authorize(...MANAGERS), createExam);
router.get('/', getExams);
router.get('/:id', getExamById);
router.put('/:id', authorize(...MANAGERS), updateExam);
router.delete('/:id', authorize(...MANAGERS), deleteExam);

module.exports = router;
