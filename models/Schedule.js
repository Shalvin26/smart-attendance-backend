const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
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
  dayOfWeek: {
    type: String,
    required: true
  },
  lectureNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'conducted', 'cancelled', 'rescheduled'],
    default: 'upcoming'
  }
}, { timestamps: true });

// Compound index for fast queries
scheduleSchema.index({ subjectId: 1, date: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);