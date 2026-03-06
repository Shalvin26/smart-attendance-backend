const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { getStudents } = require('../controllers/auth.controller');

router.get('/students', authMiddleware, roleMiddleware('teacher'), getStudents);

module.exports = router;