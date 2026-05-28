<template>
  <div class="container">
    <app-header />

    <div class="content">
      <div class="card filters-card">
        <h2>🌍 Segnalazioni della community</h2>

        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Cerca per luogo o descrizione..."
            @input="onFilterChange"
          />
        </div>

        <div class="filters">
          <report-type-select
            v-model="filterType"
            placeholder="Tutti i tipi"
            @change="onFilterChange"
          />
          <select v-model="sortBy" @change="onFilterChange">
            <option value="date">📅 Più recenti</option>
            <option value="severity">🔴 Per gravità</option>
            <option value="likes">👍 Più popolari</option>
          </select>
          <label class="toggle-label">
            <input type="checkbox" v-model="onlyReal" @change="onFilterChange" />
            Solo verificate
          </label>
        </div>
      </div>

      <button @click="goProfile">Nuova Segnalazione +</button>

      <div class="card">
        <loading-spinner v-if="loading" />
        <template v-else>
          <div v-if="reports.length === 0" class="empty">
            Nessuna segnalazione trovata
          </div>
          <div
            v-for="report in reports"
            :key="report._id"
            :id="'report-' + report._id"
            class="report-item"
            @click="$router.push('/report/' + report._id)"
          >
            <div class="report-header">
              <span class="report-type">{{ typeLabel(report.type) }}</span>
              <div class="report-badges">
                <span v-if="report.aiAnalysis?.severity" :class="'severity severity--' + report.aiAnalysis.severity">
                  {{ severityLabel(report.aiAnalysis.severity) }}
                </span>
                <span v-if="report.aiAnalysis?.isFake === false" class="legit-badge">✅ Verificata</span>
              </div>
            </div>
            <p class="report-meta">👤 {{ report.user?.email }}</p>
            <p class="report-meta">📍 {{ report.location }}</p>
            <p class="report-description">{{ report.description }}</p>
            <p class="report-date">{{ formatDate(report.createdAt) }}</p>
            <div class="report-reactions">
              <span>👍 {{ report.likes?.length || 0 }}</span>
              <span>👎 {{ report.dislikes?.length || 0 }}</span>
              <span>💬 {{ report.commentsCount || 0 }}</span>
            </div>
          </div>

          <pagination-controls
            :current-page="currentPage"
            :total-pages="totalPages"
            @change="changePage"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
import AppHeader from '../components/AppHeader.vue'
import PaginationControls from '../components/PaginationControls.vue'
import ReportTypeSelect from '../components/ReportTypeSelect.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import commonMixin from '../mixins/common'

export default {
  name: 'HomeView',
  components: { AppHeader, PaginationControls, ReportTypeSelect, LoadingSpinner },
  mixins: [commonMixin],
  data() {
    return {
      reports: [],
      currentPage: 1,
      totalPages: 1,
      total: 0,
      loading: true,
      searchQuery: '',
      filterType: '',
      sortBy: 'date',
      onlyReal: false,
      searchTimeout: null
    }
  },
  methods: {
    async fetchReports(silent = false) {
      if (!silent) this.loading = true
      try {
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: 10,
          onlyApproved: 'true',
          sort: this.sortBy
        })
        if (this.filterType) params.append('type', this.filterType)
        if (this.onlyReal) params.append('onlyReal', 'true')
        if (this.searchQuery.trim()) params.append('search', this.searchQuery.trim())

        const res = await api.get(`/reports?${params}`)
        this.reports = res.data.reports
        this.totalPages = res.data.totalPages
        this.total = res.data.total

        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages
          await this.fetchReports(silent)
        }
      } catch (err) {
        console.error('Errore caricamento segnalazioni:', err)
      } finally {
        this.loading = false
      }
    },
    onFilterChange() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1
        this.fetchReports()
      }, 400)
    },
    changePage(page) {
      this.currentPage = page
      this.fetchReports()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    severityLabel(severity) {
      const labels = { bassa: '🟢 Bassa', media: '🟡 Media', alta: '🔴 Alta' }
      return labels[severity] || severity
    },
    goProfile() {
      if (!this.isAdmin) this.$router.push('/dashboard')
    },
    setupSocketListeners() {
      const socket = this.$store.getters.getSocket
      if (!socket) return

      // Nuova segnalazione approvata — ricarica
      this._onReportUpdated = async (data) => {
        if (data.status === 'approved') {
          await this.fetchReports(true)
        } else {
          // Rimuovi se non più approvata
          this.reports = this.reports.filter(r => r._id.toString() !== data.id.toString())
        }
      }
      this._onReportDeleted = (data) => {
        this.reports = this.reports.filter(r => r._id.toString() !== data.id.toString())
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages
        }
      }
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

      socket.on('report-updated', this._onReportUpdated)
      socket.on('report-deleted', this._onReportDeleted)
      socket.on('reactions-updated', this._onReactionsUpdated)
      socket.on('new-comment', this._onNewComment)
      socket.on('comment-deleted', this._onCommentDeleted)
      socket.on('ai-analysis-ready', this._onAiAnalysis)
      socket.on('user-deleted', this._onUserDeleted)
    }
  },
  mounted() {
    this.fetchReports()
    this.setupSocketListeners()
  },
  unmounted() {
    const socket = this.$store.getters.getSocket
    if (!socket) return
    socket.off('report-updated', this._onReportUpdated)
    socket.off('report-deleted', this._onReportDeleted)
    socket.off('reactions-updated', this._onReactionsUpdated)
    socket.off('new-comment', this._onNewComment)
    socket.off('comment-deleted', this._onCommentDeleted)
    socket.off('ai-analysis-ready', this._onAiAnalysis)
    socket.off('user-deleted', this._onUserDeleted)
  }
}
</script>

<style src="../styles/views/HomeView.scss" scoped lang="scss" />