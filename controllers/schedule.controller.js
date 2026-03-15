const Schedule = require('../models/Schedule');
const Subject = require('../models/Subject');
const generateSchedule = require('../utils/scheduleGenerator');

// ============ GENERATE SCHEDULE ============
const generateSubjectSchedule = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    if (subject.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if there are upcoming lectures already
    const existing = await Schedule.findOne({
      subjectId: subject._id,
      status: 'upcoming'
    });
    if (existing) {
      return res.status(400).json({ error: 'Schedule already generated for this subject' });
    }

    // Get all protected schedules — conducted, rescheduled, cancelled
    const protectedSchedules = await Schedule.find({
      subjectId: subject._id,
      status: { $in: ['conducted', 'rescheduled', 'cancelled'] }
    });

    // Block both current date AND original date
    const protectedDates = [];
    protectedSchedules.forEach(s => {
      // Block current date
      protectedDates.push(new Date(s.date).toDateString());
      // Block original date if exists (date it was rescheduled or cancelled FROM)
      if (s.originalDate) {
        protectedDates.push(new Date(s.originalDate).toDateString());
      }
    });

    // Remove duplicates
    const uniqueProtectedDates = [...new Set(protectedDates)];

    // Generate all lecture entries
    const allSchedules = generateSchedule(
      subject.semesterStart,
      subject.semesterEnd,
      subject.lectureDays,
      subject._id,
      subject.teacherId
    );

    // Filter out all protected dates
    const newSchedules = allSchedules.filter(s =>
      !uniqueProtectedDates.includes(new Date(s.date).toDateString())
    );

    if (newSchedules.length === 0) {
      return res.status(400).json({ error: 'No new lectures to generate' });
    }

    // Bulk insert only new schedules
    await Schedule.insertMany(newSchedules);

    res.status(201).json({
      message: 'Schedule generated successfully',
      totalLectures: newSchedules.length,
      firstLecture: newSchedules[0].date,
      lastLecture: newSchedules[newSchedules.length - 1].date
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
// ============ GET SCHEDULE (for calendar) ============
const getSchedule = async (req, res) => {
  try {
    const schedules = await Schedule.find({ subjectId: req.params.subjectId })
      .sort({ date: 1 });

    res.status(200).json({ schedules });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============ CANCEL LECTURE ============
const cancelLecture = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.scheduleId);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (schedule.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (schedule.status === 'conducted') {
      return res.status(400).json({ error: 'Cannot cancel a conducted lecture' });
    }

    if (schedule.status === 'cancelled') {
      return res.status(400).json({ error: 'Lecture is already cancelled' });
    }

    // Save original date before cancelling
    if (!schedule.originalDate) {
      schedule.originalDate = schedule.date;
    }

    schedule.status = 'cancelled';
    await schedule.save();

    res.status(200).json({ message: 'Lecture cancelled successfully', schedule });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ============ RESCHEDULE LECTURE ============
const rescheduleLecture = async (req, res) => {
  try {
    const { newDate } = req.body;

    const schedule = await Schedule.findById(req.params.scheduleId);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (schedule.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (schedule.status === 'conducted') {
      return res.status(400).json({ error: 'Cannot reschedule a conducted lecture' });
    }

    // Check if new date already has a conducted or rescheduled lecture
    const conflict = await Schedule.findOne({
      subjectId: schedule.subjectId,
      status: { $in: ['conducted', 'rescheduled'] },
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          { $dateToString: { format: "%Y-%m-%d", date: new Date(newDate) } }
        ]
      }
    });

    if (conflict) {
      return res.status(400).json({ 
        error: 'This date already has a conducted or rescheduled lecture' 
      });
    }

    schedule.date = new Date(newDate);
    schedule.status = 'rescheduled';
    await schedule.save();

    res.status(200).json({ message: 'Lecture rescheduled successfully', schedule });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { generateSubjectSchedule, getSchedule, cancelLecture, rescheduleLecture };