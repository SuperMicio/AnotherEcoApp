<template>
  <div class="container">
    <app-header :show-back="true" />

    <div class="content" v-if="report">
      <div class="report-card">
        <div class="report-top">
          <span class="report-type">{{ typeLabel(report.type) }}</span>
          <span :class="'status ' + report.status">{{ statusLabel(report.status) }}</span>
        </div>
        <p class="report-author">👤 {{ report.user?.email }}</p>
        <p class="report-location">📍 {{ report.location }}</p>
        <p class="report-description">{{ report.description }}</p>
        <p class="report-date">{{ formatDate(report.createdAt) }}</p>
        <map-view
  v-if="report.coordinates && report.coordinates.lat"
  :coordinates="report.coordinates"
  :map-id="'map-' + report._id"
/>

        <div class="reactions">
          <button @click="like" :class="['reaction-btn', userLiked ? 'active-like' : '']">
            👍 {{ report.likes?.length || 0 }}
          </button>
          <button @click="dislike" :class="['reaction-btn', userDisliked ? 'active-dislike' : '']">
            👎 {{ report.dislikes?.length || 0 }}
          </button>
        </div>

        <!-- Analisi AI -->
        <div class="ai-section">
          <div v-if="!report.aiAnalysis?.severity" class="ai-loading">
            <div class="ai-spinner"></div>
            <span>🤖 Analisi AI in corso...</span>
          </div>
          <div v-else class="ai-result">
            <h3>🤖 Analisi AI</h3>
            <div class="ai-badges">
              <span :class="'severity severity--' + report.aiAnalysis.severity">
                {{ severityLabel(report.aiAnalysis.severity) }}
              </span>
              <span v-if="report.aiAnalysis.isFake" class="fake-badge">⚠️ Possibile fake</span>
              <span v-else class="legit-badge">✅ Segnalazione legittima</span>
            </div>
            <p class="ai-reason">{{ report.aiAnalysis.reason }}</p>
            <p class="ai-date">Analizzato il {{ formatDate(report.aiAnalysis.analyzedAt) }}</p>
          </div>
        </div>

        <div v-if="isAdmin" class="admin-actions">
          <button v-if="report.status === 'pending'" @click="updateStatus('approved')" class="btn-approve">✅ Approva</button>
          <button v-if="report.status === 'pending'" @click="updateStatus('rejected')" class="btn-reject">❌ Rifiuta</button>
          <button @click="deleteReport" class="btn-delete">🗑️ Elimina segnalazione</button>
        </div>
      </div>

      <div class="comments-card">
        <h2>💬 Commenti ({{ comments.length }})</h2>
        <div class="comment-form">
          <textarea v-model="newComment" placeholder="Scrivi un commento..." rows="3"></textarea>
          <div v-if="commentSuccess" class="success">✅ Commento inviato!</div>
          <div v-if="commentError" class="error">{{ commentError }}</div>
          <button @click="submitComment">Invia commento</button>
        </div>
        <div v-if="comments.length === 0" class="empty">Nessun commento ancora</div>
        <div v-for="comment in comments" :key="comment._id" class="comment-item">
          <div class="comment-header">
            <span class="comment-author">👤 {{ comment.user?.email }}</span>
            <div class="comment-actions">
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              <button v-if="isAdmin" @click="deleteComment(comment._id)" class="btn-delete-comment">🗑️</button>
            </div>
          </div>
          <p class="comment-text">{{ comment.text }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="reportDeleted" class="deleted-card">
      <h2>🚫 Segnalazione non accessibile</h2>
      <p>Questa segnalazione non esiste o non è ancora stata approvata.</p>
      <button @click="$router.push(isAdmin ? '/admin' : '/dashboard')">
        Torna alla dashboard
      </button>
    </div>

    <div v-else class="loading">Caricamento...</div>
  </div>
</template>

<script>
import api from '../services/api'
import commonMixin from '../mixins/common'
import AppHeader from '../components/AppHeader.vue'
import MapView from '../components/MapView.vue'

export default {
  name: 'ReportDetail',
  components: { AppHeader, MapView },
  mixins: [commonMixin],
  data() {
    return {
      report: null,
      comments: [],
      newComment: '',
      reportDeleted: false,
      commentSuccess: false,
      commentError: null
    }
  },
  computed: {
    isAdmin() { return this.$store.getters.isAdmin },
    userLiked() {
      if (!this.report?.likes || !this.$store.state.userId) return false
      return this.report.likes.some(id => id.toString() === this.$store.state.userId)
    },
    userDisliked() {
      if (!this.report?.dislikes || !this.$store.state.userId) return false
      return this.report.dislikes.some(id => id.toString() === this.$store.state.userId)
    }
  },
  watch: {
    '$route.params.id'(newId, oldId) {
      if (newId !== oldId) {
        this.report = null
        this.reportDeleted = false
        this.comments = []
        this.fetchReport()
        this.fetchComments()
      }
    }
  },
  methods: {
    async fetchReport() {
      try {
        const res = await api.get(`/reports/${this.$route.params.id}`)
        this.report = res.data
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 403) {
          this.reportDeleted = true
        } else {
          console.error('Errore caricamento segnalazione:', err)
        }
      }
    },
    async fetchComments() {
      try {
        const res = await api.get(`/reports/${this.$route.params.id}/comments`)
        this.comments = res.data
      } catch (err) {
        console.error('Errore caricamento commenti:', err)
      }
    },
    async submitComment() {
      if (!this.newComment.trim()) return
      try {
        await api.post(`/reports/${this.$route.params.id}/comments`, { text: this.newComment })
        this.newComment = ''
        this.commentSuccess = true
        this.commentError = null
        setTimeout(() => { this.commentSuccess = false }, 3000)
        await this.fetchComments()
      } catch (err) {
        this.commentError = 'Errore invio commento'
      }
    },
    async like() {
      try {
        await api.post(`/reports/${this.$route.params.id}/like`, {})
        await this.fetchReport()
      } catch (err) {
        console.error('Errore like:', err)
      }
    },
    async dislike() {
      try {
        await api.post(`/reports/${this.$route.params.id}/dislike`, {})
        await this.fetchReport()
      } catch (err) {
        console.error('Errore dislike:', err)
      }
    },
    async updateStatus(status) {
      try {
        await api.patch(`/reports/${this.$route.params.id}/status`, { status })
        await this.fetchReport()
      } catch (err) {
        console.error('Errore aggiornamento stato:', err)
      }
    },
    async deleteReport() {
      if (!confirm('Sei sicuro di voler eliminare questa segnalazione?')) return
      try {
        await api.delete(`/reports/${this.$route.params.id}`)
        this.$router.push('/admin')
      } catch (err) {
        alert('Errore: ' + (err.response?.data?.message || err.message))
      }
    },
    async deleteComment(commentId) {
      if (!confirm('Eliminare questo commento?')) return
      try {
        await api.delete(`/reports/${this.$route.params.id}/comments/${commentId}`)
        await this.fetchComments()
      } catch (err) {
        console.error('Errore eliminazione commento:', err)
      }
    },
    severityLabel(severity) {
      const labels = { bassa: '🟢 Bassa gravità', media: '🟡 Media gravità', alta: '🔴 Alta gravità' }
      return labels[severity] || severity
    },
    setupSocketListeners() {
      const socket = this.$store.getters.getSocket
      if (!socket) return

      this._onNewComment = (data) => {
        if (data.reportId === this.$route.params.id) {
          this.comments.push(data.comment)
        }
      }
      this._onCommentDeleted = (data) => {
        if (data.reportId === this.$route.params.id) {
          this.comments = this.comments.filter(c => c._id !== data.commentId)
        }
      }
      this._onReportUpdated = (data) => {
        if (this.report && data.id === this.$route.params.id) {
          this.report.status = data.status
        }
      }
      this._onReactionsUpdated = (data) => {
        if (this.report && data.reportId === this.$route.params.id) {
          this.report.likes = data.likes
          this.report.dislikes = data.dislikes
        }
      }
      this._onReportDeleted = (data) => {
        if (data.id.toString() === this.$route.params.id) {
          this.report = null
          this.reportDeleted = true
        }
      }
      this._onAiAnalysis = (data) => {
        if (data.reportId.toString() === this.$route.params.id.toString()) {
          if (this.report) {
            this.report.aiAnalysis = data.analysis
          }
        }
      }
      this._onUserDeleted = (data) => {
      if (this.report?.user?._id?.toString() === data.userId.toString()) {
        this.report = { ...this.report, user: { email: '[utente eliminato]' } }
      }
      this.comments = this.comments.map(c => {
        if (c.user?._id?.toString() === data.userId.toString()) {
          return { ...c, user: { email: '[utente eliminato]' } }
        }
        return c
      })
    }

      socket.on('new-comment', this._onNewComment)
      socket.on('comment-deleted', this._onCommentDeleted)
      socket.on('report-updated', this._onReportUpdated)
      socket.on('reactions-updated', this._onReactionsUpdated)
      socket.on('report-deleted', this._onReportDeleted)
      socket.on('ai-analysis-ready', this._onAiAnalysis)
      socket.on('user-deleted', this._onUserDeleted)
    }
  },
  mounted() {
    this.fetchReport()
    this.fetchComments()
    this.setupSocketListeners()
  },
  unmounted() {
    const socket = this.$store.getters.getSocket
    if (!socket) return
    socket.off('new-comment', this._onNewComment)
    socket.off('comment-deleted', this._onCommentDeleted)
    socket.off('report-updated', this._onReportUpdated)
    socket.off('reactions-updated', this._onReactionsUpdated)
    socket.off('report-deleted', this._onReportDeleted)
    socket.off('ai-analysis-ready', this._onAiAnalysis)
    socket.off('user-deleted', this._onUserDeleted)
  }
}
</script>

<style src="../styles/views/ReportDetail.scss" scoped lang="scss" />