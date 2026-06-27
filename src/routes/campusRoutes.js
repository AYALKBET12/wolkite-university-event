const express = require('express');
const router = express.Router();
const {
  createCampus,
  getCampuses,
  getCampusById,
  updateCampus,
  deleteCampus,
  getPublicCampuses,
} = require('../controllers/campusController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ROLES, ORG_MANAGERS } = require('../config/constants');

// Public route - must be registered BEFORE the protect middleware below,
// since it's used by the registration form for users who have no account yet.
router.get('/public', getPublicCampuses);

router.use(protect, applyCampusScope);

router.post('/', authorize(ROLES.SUPER_ADMIN), createCampus);
router.get('/', getCampuses);
router.get('/:id', getCampusById);
router.put('/:id', authorize(...ORG_MANAGERS), updateCampus);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN), deleteCampus);

module.exports = router;
