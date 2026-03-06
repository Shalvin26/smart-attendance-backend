const Schedule = require('../models/Schedule');
const Subject = require('../models/Subject');
const generateSchedule = require('../utils/scheduleGenerator');

// schedule generating 
const generateSubjectSchedule = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Make sure teacher owns this subject
    if (subject.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if schedule already generated
    const existing = await Schedule.findOne({ subjectId: subject._id });
    if (existing) {
      return res.status(400).json({ error: 'Schedule already generated for this subject' });
    }

    // Generate all lecture entries
    const schedules = generateSchedule(
      subject.semesterStart,
      subject.semesterEnd,
      subject.lectureDays,
      subject._id,
      subject.teacherId
    );

    if (schedules.length === 0) {
      return res.status(400).json({ error: 'No lectures generated, check semester dates and lecture days' });
    }

    // Bulk insert — single DB operation
    await Schedule.insertMany(schedules);

    res.status(201).json({
      message: 'Schedule generated successfully',
      totalLectures: schedules.length,
      firstLecture: schedules[0].date,
      lastLecture: schedules[schedules.length - 1].date
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

//  schedule  (for calendar)
const getSchedule = async (req, res) => {
  try {
    const schedules = await Schedule.find({ subjectId: req.params.subjectId })
      .sort({ date: 1 }); // ascending order

    res.status(200).json({ schedules });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

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

    schedule.status = 'cancelled';
    await schedule.save();

    res.status(200).json({ message: 'Lecture cancelled successfully', schedule });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// lecture reschudeling
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

    schedule.date = new Date(newDate);
    schedule.status = 'rescheduled';
    await schedule.save();

    res.status(200).json({ message: 'Lecture rescheduled successfully', schedule });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { generateSubjectSchedule, getSchedule, cancelLecture, rescheduleLecture };
 