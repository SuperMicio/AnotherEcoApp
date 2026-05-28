const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.toggleBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    user.banned = !user.banned;
    await user.save();

    req.io.emit('user-banned', { userId: user._id.toString(), banned: user.banned });
    res.json({ message: user.banned ? 'Utente bannato' : 'Ban rimosso', banned: user.banned });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.io.emit('user-deleted', { userId: req.params.id });
    res.json({ message: 'Utente eliminato' });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};