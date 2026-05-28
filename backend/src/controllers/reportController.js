const Report = require('../models/Report');
const Comment = require('../models/Comment');
const { analyzeReport } = require('../services/geminiService');

const populateUser = (query) => query.populate('user', 'email');
const mapDeletedUser = (reports) => reports.map(r => ({
  ...r.toObject(),
  user: r.user || { email: '[utente eliminato]' }
}));

const analyzeReportAsync = async (reportId, type, description, location, io) => {
  try {
    const analysis = await analyzeReport(type, description, location)
    console.log('AI Analysis result:', analysis)
    await Report.findByIdAndUpdate(reportId, {
      aiAnalysis: {
        severity: analysis.severity,
        isFake: analysis.isFake,
        reason: analysis.reason,
        analyzedAt: new Date()
      }
    })
    io.emit('ai-analysis-ready', { reportId, analysis })
  } catch (err) {
    console.error('Errore analisi AI:', err.message)
  }
}

const canAccessReport = (report, user) => {
  if (!report) return false
  if (user.role === 'admin') return true
  if (report.status === 'approved') return true
  if (report.user?._id?.toString() === user._id.toString()) return true
  return false
}

exports.createReport = async (req, res) => {
  try {
    const { type, description, location, coordinates } = req.body;

    if (!type || !description || !location) {
      return res.status(400).json({ message: 'Tutti i campi sono obbligatori' })
    }
    if (description.length < 10) {
      return res.status(400).json({ message: 'Descrizione troppo corta (min 10 caratteri)' })
    }
    if (location.length < 3) {
      return res.status(400).json({ message: 'Luogo troppo corto (min 3 caratteri)' })
    }

    const report = new Report({
      type, description, location,
      coordinates: coordinates || { lat: null, lng: null },
      user: req.user._id
    });
    await report.save();

    analyzeReportAsync(report._id, type, description, location, req.io)

    const populated = await populateUser(Report.findById(report._id));

    req.io.emit('new-report', {
      id: report._id, type: report.type,
      description: report.description, location: report.location,
      createdAt: report.createdAt
    });

    res.status(201).json({ message: 'Segnalazione inviata', report: populated });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = req.user.role === 'admin' ? {} : { user: req.user._id };

    if (req.query.onlyApproved === 'true') {
      query = { status: 'approved' };
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.type = req.query.type;
    if (req.query.onlyReal === 'true') query['aiAnalysis.isFake'] = false;
    if (req.query.search) {
      query.$or = [
        { description: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } }
      ]
    }

    const total = await Report.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    if (req.query.sort === 'severity') {
      const pipeline = [
        { $match: query },
        { $addFields: {
          severityOrder: {
            $switch: {
              branches: [
                { case: { $eq: ['$aiAnalysis.severity', 'alta'] }, then: 3 },
                { case: { $eq: ['$aiAnalysis.severity', 'media'] }, then: 2 },
                { case: { $eq: ['$aiAnalysis.severity', 'bassa'] }, then: 1 }
              ],
              default: 0
            }
          }
        }},
        { $sort: { severityOrder: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userArr' } },
        { $addFields: { user: { $arrayElemAt: ['$userArr', 0] } } },
        { $unset: ['userArr', 'severityOrder'] }
      ]

      const reports = await Report.aggregate(pipeline)
      const reportsWithCounts = await Promise.all(
        reports.map(async (r) => {
          const commentsCount = await Comment.countDocuments({ report: r._id })
          const user = r.user ? { _id: r.user._id, email: r.user.email } : { email: '[utente eliminato]' }
          return { ...r, user, commentsCount }
        })
      )

      return res.json({ reports: reportsWithCounts, totalPages, currentPage: page, total });
    }

    if (req.query.sort === 'likes') {
      const pipeline = [
        { $match: query },
        { $addFields: { likesCount: { $size: '$likes' } } },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userArr' } },
        { $addFields: { user: { $arrayElemAt: ['$userArr', 0] } } },
        { $unset: ['userArr', 'likesCount'] }
      ]

      const reports = await Report.aggregate(pipeline)
      const reportsWithCounts = await Promise.all(
        reports.map(async (r) => {
          const commentsCount = await Comment.countDocuments({ report: r._id })
          const user = r.user ? { _id: r.user._id, email: r.user.email } : { email: '[utente eliminato]' }
          return { ...r, user, commentsCount }
        })
      )

      return res.json({ reports: reportsWithCounts, totalPages, currentPage: page, total });
    }

    let reports = await populateUser(
      Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
    );

    reports = mapDeletedUser(reports);

    const reportsWithCounts = await Promise.all(
      reports.map(async (r) => {
        const commentsCount = await Comment.countDocuments({ report: r._id })
        return { ...r, commentsCount }
      })
    )

    res.json({ reports: reportsWithCounts, totalPages, currentPage: page, total });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await populateUser(Report.findById(req.params.id));
    if (!report) return res.status(404).json({ message: 'Segnalazione non trovata' });

    if (!canAccessReport(report, req.user)) {
      return res.status(403).json({ message: 'Non hai accesso a questa segnalazione' });
    }

    const result = {
      ...report.toObject(),
      user: report.user || { email: '[utente eliminato]' }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const validStatuses = ['pending', 'approved', 'rejected']
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: 'Stato non valido' })
    }
    const existingReport = await Report.findById(req.params.id)
    if (!existingReport) return res.status(404).json({ message: 'Segnalazione non trovata' })
    if (existingReport.status === req.body.status) {
      return res.status(400).json({ message: 'Stato già impostato' })
    }

    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );

    req.io.emit('report-updated', {
      id: report._id,
      status: report.status,
      ownerId: report.user.toString()
    });

    res.json({ message: 'Stato aggiornato', report });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.likeReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Segnalazione non trovata' });

    if (!canAccessReport(report, req.user)) {
      return res.status(403).json({ message: 'Non hai accesso a questa segnalazione' });
    }

    const userId = req.user._id;
    if (report.likes.includes(userId)) {
      report.likes.pull(userId);
    } else {
      report.likes.push(userId);
      report.dislikes.pull(userId);
    }

    await report.save();
    req.io.emit('reactions-updated', { reportId: report._id, likes: report.likes, dislikes: report.dislikes });
    res.json({ likes: report.likes.length, dislikes: report.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.dislikeReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Segnalazione non trovata' });

    if (!canAccessReport(report, req.user)) {
      return res.status(403).json({ message: 'Non hai accesso a questa segnalazione' });
    }

    const userId = req.user._id;
    if (report.dislikes.includes(userId)) {
      report.dislikes.pull(userId);
    } else {
      report.dislikes.push(userId);
      report.likes.pull(userId);
    }

    await report.save();
    req.io.emit('reactions-updated', { reportId: report._id, likes: report.likes, dislikes: report.dislikes });
    res.json({ likes: report.likes.length, dislikes: report.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ report: req.params.id });
    req.io.emit('report-deleted', { id: req.params.id });
    res.json({ message: 'Segnalazione eliminata' });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Segnalazione non trovata' });

    if (!canAccessReport(report, req.user)) {
      return res.status(403).json({ message: 'Non hai accesso a questa segnalazione' });
    }

    let comments = await Comment.find({ report: req.params.id })
      .populate('user', 'email').sort({ createdAt: 1 });
    comments = comments.map(c => ({
      ...c.toObject(),
      user: c.user || { email: '[utente eliminato]' }
    }));
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    if (!req.body.text || req.body.text.trim().length < 2) {
      return res.status(400).json({ message: 'Commento troppo corto (min 2 caratteri)' })
    }

    const report = await populateUser(Report.findById(req.params.id));
    if (!report) return res.status(404).json({ message: 'Segnalazione non trovata' });

    if (!canAccessReport(report, req.user)) {
      return res.status(403).json({ message: 'Non hai accesso a questa segnalazione' });
    }

    const comment = new Comment({ report: req.params.id, user: req.user._id, text: req.body.text });
    await comment.save();
    const populated = await Comment.findById(comment._id).populate('user', 'email');

    const reportOwnerId = report.user._id.toString()
    const commentAuthorId = req.user._id.toString()

    req.io.emit('new-comment', {
      reportId: req.params.id,
      reportOwnerId,
      notifyOwner: reportOwnerId !== commentAuthorId,
      comment: { _id: populated._id, text: populated.text, user: populated.user, createdAt: populated.createdAt }
    })

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.commentId);
    req.io.emit('comment-deleted', { reportId: req.params.reportId, commentId: req.params.commentId });
    res.json({ message: 'Commento eliminato' });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await Report.countDocuments();
    const pending = await Report.countDocuments({ status: 'pending' });
    const approved = await Report.countDocuments({ status: 'approved' });
    const rejected = await Report.countDocuments({ status: 'rejected' });
    const byType = await Report.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
    res.json({ total, pending, approved, rejected, byType });
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err.message });
  }
};