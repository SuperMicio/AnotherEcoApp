<template>
  <div class="container">
    <app-header title="Admin" />
    <div class="content">
      <div class="card">
        <div class="admin-nav">
          <h2>📋 Segnalazioni ({{ total }})</h2>
          <div class="nav-buttons">
            <button @click="$router.push('/admin/users')" class="nav-btn">👥 Utenti</button>
            <button @click="$router.push('/admin/stats')" class="nav-btn">📊 Statistiche</button>
          </div>
        </div>
        <div class="filters">
          <select v-model="filterStatus" @change="onFilterChange">
            <option value="">Tutti gli stati</option>
            <option value="pending">In attesa</option>
            <option value="approved">Approvate</option>
            <option value="rejected">Rifiutate</option>
          </select>
          <report-type-select v-model="filterType" placeholder="Tutti i tipi" @change="onFilterChange" />
        </div>
        <loading-spinner v-if="loading" />
        <template v-else>
          <report-list
            :reports="reports"
            :show-user="true"
            :show-actions="true"
            @approve="updateStatus($event, 'approved')"
            @reject="updateStatus($event, 'rejected')"
          />
          <pagination-controls :current-page="currentPage" :total-pages="totalPages" @change="changePage" />
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
import AppHeader from '../components/AppHeader.vue'
import ReportList from '../components/ReportList.vue'
import PaginationControls from '../components/PaginationControls.vue'
import ReportTypeSelect from '../components/ReportTypeSelect.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import reportsMixin from '../mixins/reports'
import socketReportsMixin from '../mixins/socketReports'

export default {
  name: 'AdminDashboard',
  components: { AppHeader, ReportList, PaginationControls, ReportTypeSelect, LoadingSpinner },
  mixins: [reportsMixin, socketReportsMixin],
  data() {
    return {
      filterStatus: '',
      filterType: ''
    }
  },
  computed: {
    activeFilters() {
      const f = {}
      if (this.filterStatus) f.status = this.filterStatus
      if (this.filterType) f.type = this.filterType
      return f
    }
  },
  methods: {
    async updateStatus(id, status) {
      try {
        await api.patch(`/reports/${id}/status`, { status })
        await this.fetchReports(this.activeFilters, true)
      } catch (err) {
        console.error('Errore aggiornamento stato:', err)
      }
    },
    onFilterChange() {
      this.currentPage = 1
      this.fetchReports(this.activeFilters)
    },
    setupSocketListeners() {
      const socket = this.$store.getters.getSocket
      if (!socket) return

      this._onNewReport = async () => { await this.fetchReports(this.activeFilters, true) }
      this._onReportUpdated = async () => { await this.fetchReports(this.activeFilters, true) }
      this._onReportDeleted = async () => { await this.fetchReports(this.activeFilters, true) }

      socket.on('new-report', this._onNewReport)
      socket.on('report-updated', this._onReportUpdated)
      socket.on('report-deleted', this._onReportDeleted)

      this.setupSharedSocketListeners(socket)
    }
  },
  mounted() {
    this.fetchReports(this.activeFilters)
    this.setupSocketListeners()
  },
  unmounted() {
    const socket = this.$store.getters.getSocket
    if (!socket) return
    socket.off('new-report', this._onNewReport)
    socket.off('report-updated', this._onReportUpdated)
    socket.off('report-deleted', this._onReportDeleted)
    this.teardownSharedSocketListeners(socket)
  }
}
</script>

<style src="../styles/views/AdminDashboard.scss" scoped lang="scss" />