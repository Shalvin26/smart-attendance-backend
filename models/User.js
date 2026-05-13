const mongoose = require('mongoose');

const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'CHE'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student'], required: true },
  rollNumber: {
    type: String,
    required: function () { return this.role === 'student'; },
    trim: true
  },
  branch: {
    type: String,
    required: true,
    enum: BRANCHES
  },
  collegeName: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);