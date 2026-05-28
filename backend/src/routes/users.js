const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/', auth, isAdmin, userController.getUsers);
router.patch('/:id/ban', auth, isAdmin, userController.toggleBan);
router.delete('/:id', auth, isAdmin, userController.deleteUser);

module.exports = router;