const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  approveUser,
  rejectUser,
  suspendUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ROLES } = require('../config/constants');

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN];
const APPROVERS = [ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD];

router.use(protect, applyCampusScope);

router.get('/', authorize(...APPROVERS), getUsers);
router.get('/:id', authorize(...APPROVERS), getUserById);
router.patch('/:id/approve', authorize(...APPROVERS), approveUser);
router.patch('/:id/reject', authorize(...APPROVERS), rejectUser);
router.patch('/:id/suspend', authorize(...ADMIN_ROLES), suspendUser);
router.put('/:id', updateUser); // self-update allowed; ownership/scope checked inside
router.delete('/:id', authorize(...ADMIN_ROLES), deleteUser);

module.exports = router;
