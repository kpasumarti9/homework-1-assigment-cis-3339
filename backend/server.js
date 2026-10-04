const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cis3339_homework1';

app.use(cors());
app.use(express.json());

const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  zip: { type: String, required: true, trim: true }
}, { versionKey: false });

const courseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true }
}, { versionKey: false });

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, trim: true },
  courseId: { type: String, required: true, trim: true }
}, { versionKey: false });

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);
const Course = mongoose.model('Course', courseSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

function escapeRegexp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeStudent(student) {
  return {
    id: String(student.id || student.studentId || '').trim(),
    name: String(student.name || '').trim(),
    phone: String(student.phone || '').trim(),
    zip: String(student.zip || '').trim()
  };
}

function normalizeCourse(course) {
  return {
    id: String(course.id || course.courseId || '').trim(),
    name: String(course.name || '').trim()
  };
}

function normalizeEnrollment(enrollment) {
  return {
    studentId: String(enrollment.studentId || '').trim(),
    courseId: String(enrollment.courseId || '').trim()
  };
}

async function checkDatabaseConnection() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected.');
  }
}

async function isDuplicateKeyError(error) {
  return error && error.code === 11000;
}

app.get('/api/health', async (req, res) => {
  try {
    await checkDatabaseConnection();
    res.json({ status: 'ok', database: mongoose.connection.name });
  } catch (error) {
    res.status(503).json({ error: 'Database connection unavailable.' });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const students = await Student.find({}).sort({ name: 1 }).lean();
    res.json(students.map((student) => ({
      id: student.id,
      name: student.name,
      phone: student.phone,
      zip: student.zip
    })));
  } catch (error) {
    res.status(503).json({ error: 'Unable to load students.' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const { name, studentId, id, phone, zip } = req.body;
    const normalizedId = String(studentId ?? id ?? '').trim();

    if (!name || !normalizedId || !phone || !zip) {
      return res.status(400).json({ error: 'Name, student ID, phone, and ZIP are required.' });
    }

    const studentExists = await Student.exists({
      $or: [
        { id: normalizedId },
        { name: { $regex: new RegExp(`^${escapeRegexp(String(name).trim())}$`, 'i') } }
      ]
    });

    if (studentExists) {
      return res.status(409).json({ error: 'Student ID or name already exists.' });
    }

    const student = await Student.create(normalizeStudent({
      id: normalizedId,
      name,
      phone,
      zip
    }));

    return res.status(201).json({
      message: 'Student added successfully.',
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        zip: student.zip
      }
    });
  } catch (error) {
    if (await isDuplicateKeyError(error)) {
      return res.status(409).json({ error: 'Student already exists.' });
    }
    return res.status(500).json({ error: 'Unable to add student.' });
  }
});

app.delete('/api/students/:studentId', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const { studentId } = req.params;
    const student = await Student.findOneAndDelete({ id: studentId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    await Enrollment.deleteMany({ studentId });
    return res.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to delete student.' });
  }
});

app.post('/find-student', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Student name is required.' });
    }

    const safeName = String(name).trim();
    const student = await Student.findOne({ name: { $regex: new RegExp(`^${escapeRegexp(safeName)}$`, 'i') } }).lean();

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.json({
      id: student.id,
      name: student.name,
      phone: student.phone,
      zip: student.zip
    });
  } catch (error) {
    return res.status(503).json({ error: 'Unable to find student.' });
  }
});

app.post('/add-student', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const { name, studentId, id, phone, zip } = req.body;
    const normalizedId = String(studentId ?? id ?? '').trim();

    if (!name || !normalizedId || !phone || !zip) {
      return res.status(400).json({ error: 'All fields (name, student ID, phone, zip) are required.' });
    }

    const studentExists = await Student.exists({
      $or: [
        { id: normalizedId },
        { name: { $regex: new RegExp(`^${escapeRegexp(String(name).trim())}$`, 'i') } }
      ]
    });

    if (studentExists) {
      return res.status(409).json({ error: 'Student already exists.' });
    }

    const student = await Student.create(normalizeStudent({ id: normalizedId, name, phone, zip }));
    return res.status(201).json({
      message: 'Student added successfully',
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        zip: student.zip
      }
    });
  } catch (error) {
    if (await isDuplicateKeyError(error)) {
      return res.status(409).json({ error: 'Student already exists.' });
    }
    return res.status(500).json({ error: 'Unable to add student.' });
  }
});

app.post('/delete-student', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Student name is required.' });
    }

    const student = await Student.findOneAndDelete({
      name: { $regex: new RegExp(`^${escapeRegexp(String(name).trim())}$`, 'i') }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    await Enrollment.deleteMany({ studentId: student.id });
    return res.json({ message: 'Student deleted successfully', student: { id: student.id, name: student.name, phone: student.phone, zip: student.zip } });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to delete student.' });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const courses = await Course.find({}).sort({ name: 1 }).lean();
    res.json(courses.map((course) => ({
      id: course.id,
      name: course.name
    })));
  } catch (error) {
    res.status(503).json({ error: 'Unable to load courses.' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const { name, courseId, id } = req.body;
    const normalizedId = String(courseId ?? id ?? '').trim();

    if (!name || !normalizedId) {
      return res.status(400).json({ error: 'Course ID and name are required.' });
    }

    const courseExists = await Course.exists({
      $or: [
        { id: normalizedId },
        { name: { $regex: new RegExp(`^${escapeRegexp(String(name).trim())}$`, 'i') } }
      ]
    });

    if (courseExists) {
      return res.status(409).json({ error: 'Course ID or name already exists.' });
    }

    const course = await Course.create(normalizeCourse({ id: normalizedId, name }));
    return res.status(201).json({
      message: 'Course added successfully.',
      course: {
        id: course.id,
        name: course.name
      }
    });
  } catch (error) {
    if (await isDuplicateKeyError(error)) {
      return res.status(409).json({ error: 'Course already exists.' });
    }
    return res.status(500).json({ error: 'Unable to add course.' });
  }
});

app.delete('/api/courses/:courseId', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const { courseId } = req.params;
    const course = await Course.findOneAndDelete({ id: courseId });

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    await Enrollment.deleteMany({ courseId });
    return res.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to delete course.' });
  }
});

app.get('/api/enrollments', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const enrollments = await Enrollment.find({}).lean();
    res.json(enrollments.map((enrollment) => ({
      studentId: enrollment.studentId,
      courseId: enrollment.courseId
    })));
  } catch (error) {
    res.status(503).json({ error: 'Unable to load enrollments.' });
  }
});

app.post('/api/enrollments', async (req, res) => {
  try {
    await checkDatabaseConnection();
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'Student and course are required.' });
    }

    const student = await Student.exists({ id: studentId });
    const course = await Course.exists({ id: courseId });

    if (!student || !course) {
      return res.status(404).json({ error: 'Student or course not found.' });
    }

    const duplicate = await Enrollment.exists({ studentId, courseId });
    if (duplicate) {
      return res.status(409).json({ error: 'Duplicate enrollment not allowed.' });
    }

    const enrollment = await Enrollment.create(normalizeEnrollment({ studentId, courseId }));
    return res.status(201).json({
      message: 'Enrollment added successfully.',
      enrollment: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId
      }
    });
  } catch (error) {
    if (await isDuplicateKeyError(error)) {
      return res.status(409).json({ error: 'Duplicate enrollment not allowed.' });
    }
    return res.status(500).json({ error: 'Unable to add enrollment.' });
  }
});

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
