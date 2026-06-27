const express = require('express');
const router = express.Router();
const {
  createCollege,
  getColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
  getPublicColleges,
} = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ORG_MANAGERS } = require('../config/constants');

router.get('/public', getPublicColleges);

router.use(protect, applyCampusScope);

router.post('/', authorize(...ORG_MANAGERS), createCollege);
router.get('/', getColleges);
router.get('/:id', getCollegeById);
router.put('/:id', authorize(...ORG_MANAGERS), updateCollege);
router.delete('/:id', authorize(...ORG_MANAGERS), deleteCollege);

module.exports = router;
