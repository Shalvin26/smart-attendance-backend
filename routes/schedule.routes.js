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

// ============ CLEANUP ROUTE ============
// Run once to fix existing duplicate upcoming lectures on conducted dates
// Remove this route after running once
router.delete('/cleanup/:subjectId', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    // Get all conducted dates for this subject
    const conducted = await Schedule.find({
      subjectId: req.params.subjectId,
      status: 'conducted'
    });

    const conductedDates = conducted.map(s =>
      new Date(s.date).toDateString()
    );

    // Delete any upcoming lecture that falls on a conducted date
    // Never touch rescheduled lectures
    let deleted = 0;
    for (const date of conductedDates) {
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