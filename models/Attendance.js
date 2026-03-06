const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  attendance: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      rollNumber: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['present', 'absent'],
        required: true
      }
    }
  ]
}, { timestamps: true });

// Prevent duplicate attendance for same subject on same date
attendanceSchema.index({ subjectId: 1, scheduleId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);