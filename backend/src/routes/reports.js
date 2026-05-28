const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.post('/', auth, reportController.createReport);
router.get('/', auth, reportController.getReports);
router.get('/admin/stats', auth, isAdmin, reportController.getStats);
router.get('/:id', auth, reportController.getReportById);
router.patch('/:id/status', auth, isAdmin, reportController.updateStatus);
router.post('/:id/like', auth, reportController.likeReport);
router.post('/:id/dislike', auth, reportController.dislikeReport);
router.delete('/:id', auth, isAdmin, reportController.deleteReport);
router.get('/:id/comments', auth, reportController.getComments);
router.post('/:id/comments', auth, reportController.addComment);
router.delete('/:reportId/comments/:commentId', auth, isAdmin, reportController.deleteComment);

module.exports = router;