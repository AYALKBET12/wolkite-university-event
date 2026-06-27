const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const campusRoutes = require('./routes/campusRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const eventRoutes = require('./routes/eventRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const examRoutes = require('./routes/examRoutes');
const researchRoutes = require('./routes/researchRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Basic rate limiting on auth endpoints to slow down brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Wolkite University Events API is running' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campuses', campusRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/weather', weatherRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
