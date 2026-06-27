const express = require('express');
const router = express.Router();
const {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');
const { applyCampusScope } = require('../middleware/scope');
const { ROLES } = require('../config/constants');

router.use(protect, applyCampusScope);

router.post('/', authorize(ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF), createNotice);
router.get('/', getNotices);
router.get('/:id', getNoticeById);
router.put('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF), updateNotice);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.DEPT_HEAD, ROLES.STAFF), deleteNotice);

module.exports = router;
