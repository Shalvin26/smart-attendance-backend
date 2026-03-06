const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { generateSubjectSchedule, getSchedule, cancelLecture, rescheduleLecture } = require('../controllers/schedule.controller');

router.post('/generate/:subjectId', authMiddleware, roleMiddleware('teacher'), generateSubjectSchedule);
router.get('/:subjectId', authMiddleware, getSchedule);

router.patch('/:scheduleId/cancel', authMiddleware, roleMiddleware('teacher'), cancelLecture);
router.patch('/:scheduleId/reschedule', authMiddleware, roleMiddleware('teacher'), rescheduleLecture);

module.exports = router;