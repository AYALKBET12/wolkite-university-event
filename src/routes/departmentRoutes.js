const express = require('express');
const router = express.Router();
const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getPublicDepartments,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ORG_MANAGERS } = require('../config/constants');

router.get('/public', getPublicDepartments);

router.use(protect, applyCampusScope);

router.post('/', authorize(...ORG_MANAGERS), createDepartment);
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.put('/:id', authorize(...ORG_MANAGERS), updateDepartment);
router.delete('/:id', authorize(...ORG_MANAGERS), deleteDepartment);

module.exports = router;
