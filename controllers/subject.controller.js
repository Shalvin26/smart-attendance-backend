const Subject = require('../models/Subject');
const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');

// subject creation
const parseLectureDays = require('../utils/parseDay');

const createSubject = async (req, res) => {
  try {
    const { name, code, semesterStart, semesterEnd, lectureDays } = req.body;

    // Parse lecture days — handles comma or space separated
    let parsedDays;
    try {
      // If frontend sends string → parse it
      // If frontend sends array already → join and reparse for consistency
      const input = Array.isArray(lectureDays) ? lectureDays.join(' ') : lectureDays;
      parsedDays = parseLectureDays(input);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const existing = await Subject.findOne({ code });
    if (existing) {
      return res.status(400).json({ error: 'Subject code already exists' });
    }

    const subject = await Subject.create({
      name,
      code,
      teacherId: req.user.userId,
      semesterStart,
      semesterEnd,
      lectureDays: parsedDays
    });

    res.status(201).json({
      message: 'Subject created successfully',
      subject
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// get subject of teacher based on id of teacher
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ teacherId: req.user.userId })
      .populate('students', 'name email rollNumber');

    res.status(200).json({ subjects });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// get single subject
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('students', 'name email rollNumber')
      .populate('teacherId', 'name email');

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.status(200).json({ subject });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ADD STUDENT TO SUBJECT 
const addStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Check if teacher owns this subject
    if (subject.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if student already added
    if (subject.students.includes(studentId)) {
      return res.status(400).json({ error: 'Student already enrolled' });
    }

    subject.students.push(studentId);
    await subject.save();

    res.status(200).json({ message: 'Student added successfully', subject });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Make sure teacher owns this subject
    if (subject.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete subject
    await Subject.findByIdAndDelete(req.params.id);

    // Delete all schedules for this subject
    await Schedule.deleteMany({ subjectId: req.params.id });

    // Delete all attendance for this subject
    await Attendance.deleteMany({ subjectId: req.params.id });

    res.status(200).json({ message: 'Subject deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    if (subject.teacherId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, code, semesterStart, semesterEnd, lectureDays } = req.body;

    // Parse lecture days if provided
    let parsedDays;
    if (lectureDays) {
      try {
        const parseLectureDays = require('../utils/parseDay');
        const input = Array.isArray(lectureDays) ? lectureDays.join(' ') : lectureDays;
        parsedDays = parseLectureDays(input);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // Update only provided fields
    if (name) subject.name = name;
    if (code) subject.code = code;
    if (semesterStart) subject.semesterStart = semesterStart;
    if (semesterEnd) subject.semesterEnd = semesterEnd;
    if (parsedDays) subject.lectureDays = parsedDays;

    await subject.save();

    // If schedule-related fields changed, delete old schedule
    if (semesterStart || semesterEnd || lectureDays) {
     await Schedule.deleteMany({ 
        subjectId: req.params.id,
        status: { $in: ['upcoming', 'cancelled']}
      });
    }

    res.status(200).json({
      message: 'Subject updated successfully',
      subject
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages });
    }
    res.status(500).json({ error: 'Server error' });
  }
};
module.exports = { createSubject, getSubjects, getSubjectById, addStudent, deleteSubject, updateSubject };