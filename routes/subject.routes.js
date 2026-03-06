const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { createSubject, getSubjects, getSubjectById, addStudent, deleteSubject,updateSubject } = require('../controllers/subject.controller');


// All routes require login
// Create and manage — teacher only
router.post('/', authMiddleware, roleMiddleware('teacher'), createSubject);
router.get('/', authMiddleware, roleMiddleware('teacher'), getSubjects);
router.get('/:id', authMiddleware, getSubjectById);
router.post('/:id/add-student', authMiddleware, roleMiddleware('teacher'), addStudent);
router.delete('/:id', authMiddleware, roleMiddleware('teacher'), deleteSubject);
router.put('/:id', authMiddleware, roleMiddleware('teacher'), updateSubject);

module.exports = router;