export default {
  methods: {
    setupSharedSocketListeners(socket) {
      this._onReactionsUpdated = (data) => {
        const report = this.reports.find(r => r._id.toString() === data.reportId.toString())
        if (report) {
          report.likes = data.likes
          report.dislikes = data.dislikes
        }
      }
      this._onNewComment = (data) => {
        const report = this.reports.find(r => r._id.toString() === data.reportId.toString())
        if (report) report.commentsCount = (report.commentsCount || 0) + 1
      }
      this._onCommentDeleted = (data) => {
        const report = this.reports.find(r => r._id.toString() === data.reportId.toString())
        if (report && report.commentsCount > 0) report.commentsCount--
      }
      this._onAiAnalysis = (data) => {
        const report = this.reports.find(r => r._id.toString() === data.reportId.toString())
        if (report) report.aiAnalysis = data.analysis
      }
      this._onUserDeleted = (data) => {
        this.reports = this.reports.map(report => {
            if (report.user?._id?.toString() === data.userId.toString()) {
            return { ...report, user: { email: '[utente eliminato]' } }
            }
            return report
        })
      }

      socket.on('reactions-updated', this._onReactionsUpdated)
      socket.on('new-comment', this._onNewComment)
      socket.on('comment-deleted', this._onCommentDeleted)
      socket.on('ai-analysis-ready', this._onAiAnalysis)
      socket.on('user-deleted', this._onUserDeleted)
    },
    teardownSharedSocketListeners(socket) {
      socket.off('reactions-updated', this._onReactionsUpdated)
      socket.off('new-comment', this._onNewComment)
      socket.off('comment-deleted', this._onCommentDeleted)
      socket.off('ai-analysis-ready', this._onAiAnalysis)
      socket.off('user-deleted', this._onUserDeleted)
    }
  }
}