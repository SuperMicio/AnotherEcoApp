const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token mancante' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: 'Utente non trovato' });
    if (user.banned) return res.status(403).json({ message: 'Utente bannato' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token non valido' });
  }
};