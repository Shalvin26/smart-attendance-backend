const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const {
  submitAttendance,
  getSubjectAttendance,
  getStudentAnalytics,
  getAllStudentsAnalytics,
  getAllSubjectsAnalytics
} = require('../controllers/attendance.controller');

// Teacher routes
router.post('/', authMiddleware, roleMiddleware('teacher'), submitAttendance);

router.get('/all-students/:subjectId', authMiddleware, roleMiddleware('teacher'), getAllStudentsAnalytics);

// Student routes
router.get('/analytics/:subjectId', authMiddleware, roleMiddleware('student'), getStudentAnalytics);
router.get('/analytics', authMiddleware, roleMiddleware('student'), getAllSubjectsAnalytics);

router.get('/subject/:subjectId', authMiddleware, getSubjectAttendance);

module.exports = router;