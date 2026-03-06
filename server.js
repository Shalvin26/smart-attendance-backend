const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const userRoutes = require('./routes/user.routes');



dotenv.config();
connectDB();

const app = express();

//app.use(helmet());
app.use(cors());
app.use(express.json());

//routes

app.use('/api/auth', authRoutes);


const authMiddleware = require('./middleware/auth.middleware');

const subjectRoutes = require('./routes/subject.routes');
app.use('/api/subjects', subjectRoutes);

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You are in!', user: req.user });
});

app.use('/api/schedule', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Attendance API running ' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));