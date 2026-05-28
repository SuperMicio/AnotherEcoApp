const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const { email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email già registrata' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email non valida' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    await user.save();

    if (role === 'user') {
      req.io.emit('user-registered', {
        _id: user._id,
        email: user.email,
        banned: false,
        createdAt: user.createdAt
      })
    }

    res.status(201).json({ message: 'Utente registrato con successo' });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenziali non valide' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: user.role, email: user.email, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};