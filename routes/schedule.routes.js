const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const Schedule = require('../models/Schedule');
const { generateSubjectSchedule, getSchedule, cancelLecture, rescheduleLecture } = require('../controllers/schedule.controller');

router.post('/generate/:subjectId', authMiddleware, roleMiddleware('teacher'), generateSubjectSchedule);
router.get('/:subjectId', authMiddleware, getSchedule);
router.patch('/:scheduleId/cancel', authMiddleware, roleMiddleware('teacher'), cancelLecture);
router.patch('/:scheduleId/reschedule', authMiddleware, roleMiddleware('teacher'), rescheduleLecture);

router.delete('/cleanup/:subjectId', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    // Get all rescheduled and cancelled lectures with original dates
    const usedSchedules = await Schedule.find({
      subjectId: req.params.subjectId,
      status: { $in: ['conducted', 'rescheduled', 'cancelled'] }
    });

    // Build list of all blocked dates
    const blockedDates = [];
    usedSchedules.forEach(s => {
      blockedDates.push(new Date(s.date).toDateString());
      if (s.originalDate) {
        blockedDates.push(new Date(s.originalDate).toDateString());
      }
    });

    // Remove duplicates
    const uniqueBlockedDates = [...new Set(blockedDates)];

    let deleted = 0;
    for (const date of uniqueBlockedDates) {
      const result = await Schedule.deleteMany({
        subjectId: req.params.subjectId,
        status: 'upcoming',
        $expr: {
          $eq: [
            { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            { $dateToString: { format: "%Y-%m-%d", date: new Date(date) } }
          ]
        }
      });
      deleted += result.deletedCount;
    }

    res.status(200).json({
      message: `Cleaned up ${deleted} duplicate upcoming lectures`
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;