const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, branch, collegeName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name, email, password: hashedPassword, role, rollNumber, branch, collegeName
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, rollNumber: user.rollNumber,
        branch: user.branch, collegeName: user.collegeName
      }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, rollNumber: user.rollNumber,
        branch: user.branch, collegeName: user.collegeName
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Returns only students matching teacher's college + branch
const getStudents = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.userId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const students = await User.find({
      role: 'student',
      branch: teacher.branch,
      collegeName: teacher.collegeName
    }).select('name email rollNumber branch collegeName');

    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, getStudents };
