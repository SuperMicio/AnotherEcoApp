const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['water', 'road', 'soil', 'trees', 'light', 'noise', 'air'],
    required: true
  },
  description: { type: String, required: true },
  location: { type: String, required: true },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  aiAnalysis: {
    severity: { type: String, enum: ['bassa', 'media', 'alta'], default: null },
    isFake: { type: Boolean, default: null },
    reason: { type: String, default: null },
    analyzedAt: { type: Date, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);