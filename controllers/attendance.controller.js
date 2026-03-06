const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const Subject = require('../models/Subject');

//submition of attendance by teacher
const submitAttendance = async (req, res) => {
  try {
    const { scheduleId, attendance } = req.body;

    // Get the schedule entry
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Make sure teacher owns this subject
    if (schedule.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if attendance already submitted for this lecture
    const existing = await Attendance.findOne({ scheduleId });
    if (existing) {
      return res.status(400).json({ error: 'Attendance already submitted for this lecture' });
    }

    // Save attendance
    const attendanceRecord = await Attendance.create({
      subjectId: schedule.subjectId,
      scheduleId,
      teacherId: req.user.userId,
      date: schedule.date,
      attendance
    });

    // Update schedule status to conducted
    await Schedule.findByIdAndUpdate(scheduleId, { status: 'conducted' });

    res.status(201).json({
      message: 'Attendance submitted successfully',
      totalStudents: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// getting attendance records for a subject (for teacher analytics)
const getSubjectAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ subjectId: req.params.subjectId })
      .sort({ date: 1 });

    res.status(200).json({ records });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// student analytics 
const getStudentAnalytics = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const studentId = req.user.userId;

    // Get all conducted lectures for this subject
    const totalLectures = await Schedule.countDocuments({
      subjectId,
      status: 'conducted'
    });

    // Get all attendance records for this subject
    const records = await Attendance.find({ subjectId });

    // Count how many times this student was present
    let attended = 0;
    records.forEach(record => {
      const entry = record.attendance.find(
        a => a.studentId.toString() === studentId
      );
      if (entry && entry.status === 'present') {
        attended++;
      }
    });

    const percentage = totalLectures === 0 ? 0 : ((attended / totalLectures) * 100).toFixed(2);

    // Shortage prediction
    let classesNeeded = 0;
    let canSkip = 0;

    if (percentage < 75) {
      // How many  classes needed to reach 75%
      classesNeeded = Math.ceil((0.75 * totalLectures - attended) / 0.25);
    } else {
      // How many classes can be skipped
      canSkip = Math.floor((attended - 0.75 * totalLectures) / 0.75);
    }

    res.status(200).json({
      subjectId,
      totalLectures,
      attended,
      percentage: `${percentage}%`,
      status: percentage >= 75 ? 'Safe ✅' : 'Shortage ⚠️',
      classesNeeded,
      canSkip
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// teacher views analytics  of all students enrolled in a subject (for teacher analytics)
const getAllStudentsAnalytics = async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Get subject with students
    const subject = await Subject.findById(subjectId)
      .populate('students', 'name email rollNumber');

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Total conducted lectures
    const totalLectures = await Schedule.countDocuments({
      subjectId,
      status: 'conducted'
    });

    // All attendance records for this subject
    const records = await Attendance.find({ subjectId });

    // Calculate analytics for each student
    const analytics = subject.students.map(student => {
      let attended = 0;

      records.forEach(record => {
        const entry = record.attendance.find(
          a => a.studentId.toString() === student._id.toString()
        );
        if (entry && entry.status === 'present') {
          attended++;
        }
      });

      const percentage = totalLectures === 0 ? 0 : ((attended / totalLectures) * 100).toFixed(2);
      const classesNeeded = percentage < 75
        ? Math.ceil((0.75 * totalLectures - attended) / 0.25)
        : 0;
      const canSkip = percentage >= 75
        ? Math.floor((attended - 0.75 * totalLectures) / 0.75)
        : 0;

      return {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber
        },
        totalLectures,
        attended,
        percentage: `${percentage}%`,
        status: percentage >= 75 ? 'Safe ✅' : 'Shortage ⚠️',
        classesNeeded,
        canSkip
      };
    });

    res.status(200).json({ subjectId, totalLectures, analytics });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

//for student to view all subjects analytics in one go
const getAllSubjectsAnalytics = async (req, res) => {
  try {
    const studentId = req.user.userId;

    // Find all subjects this student is enrolled in
    const subjects = await Subject.find({ students: studentId });

    if (subjects.length === 0) {
      return res.status(200).json({ message: 'Not enrolled in any subject', analytics: [] });
    }

    // Calculate analytics for each subject
    const analytics = await Promise.all(subjects.map(async (subject) => {
      const totalLectures = await Schedule.countDocuments({
        subjectId: subject._id,
        status: 'conducted'
      });

      const records = await Attendance.find({ subjectId: subject._id });

      let attended = 0;
      records.forEach(record => {
        const entry = record.attendance.find(
          a => a.studentId.toString() === studentId
        );
        if (entry && entry.status === 'present') {
          attended++;
        }
      });

      const percentage = totalLectures === 0 ? 0 : ((attended / totalLectures) * 100).toFixed(2);
      const classesNeeded = percentage < 75
        ? Math.ceil((0.75 * totalLectures - attended) / 0.25)
        : 0;
      const canSkip = percentage >= 75
        ? Math.floor((attended - 0.75 * totalLectures) / 0.75)
        : 0;

      return {
        subject: {
          id: subject._id,
          name: subject.name,
          code: subject.code
        },
        totalLectures,
        attended,
        percentage: `${percentage}%`,
        status: percentage >= 75 ? 'Safe ✅' : 'Shortage ⚠️',
        classesNeeded,
        canSkip
      };
    }));

    res.status(200).json({ analytics });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  submitAttendance,
  getSubjectAttendance,
  getStudentAnalytics,
  getAllStudentsAnalytics,
  getAllSubjectsAnalytics
};