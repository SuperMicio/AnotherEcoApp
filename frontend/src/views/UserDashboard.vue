<template>
  <div class="container">
    <app-header />
    <div class="content">
      <div class="card">
        <h2>📝 Nuova Segnalazione</h2>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="success" class="success">{{ success }}</div>
        <report-type-select v-model="newReport.type" />
        <input v-model="newReport.location" type="text" placeholder="Luogo (es. Via Roma, Cesena)" />
        <textarea v-model="newReport.description" placeholder="Descrivi il problema..." rows="4"></textarea>
        <map-picker v-model="newReport.coordinates" />
        <button @click="submitReport">Invia Segnalazione</button>
      </div>
      <div class="card">
        <h2>📋 Le mie Segnalazioni ({{ total }})</h2>
        <loading-spinner v-if="loading" />
        <template v-else>
          <report-list :reports="reports" />
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
import MapPicker from '../components/MapPicker.vue'

export default {
  name: 'UserDashboard',
  components: { AppHeader, ReportList, PaginationControls, ReportTypeSelect, LoadingSpinner, MapPicker },
  mixins: [reportsMixin, socketReportsMixin],
  data() {
    return {
      newReport: { type: '', location: '', description: '', coordinates: null },
      error: null,
      success: null
    }
  },
  methods: {
    async submitReport() {
      if (!this.newReport.type || !this.newReport.location || !this.newReport.description) {
        this.error = 'Compila tutti i campi'
        return
      }
      try {
        await api.post('/reports', this.newReport)
        this.success = 'Segnalazione inviata con successo!'
        this.error = null
        this.newReport = {
          type: '',
          location: '',
          description: '',
          coordinates: null
        }
        await this.fetchReports()
        setTimeout(() => { this.success = null }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'Errore invio segnalazione'
      }
    },
    setupSocketListeners() {
      const socket = this.$store.getters.getSocket
      if (!socket) return

      this._onReportUpdated = (data) => {
        const report = this.reports.find(r => r._id.toString() === data.id.toString())
        if (report) {
          report.status = data.status
          report.isUpdated = true
          setTimeout(() => { report.isUpdated = false }, 3000)
        }
      }
      this._onReportDeleted = async () => { await this.fetchReports({}, true) }

      socket.on('report-updated', this._onReportUpdated)
      socket.on('report-deleted', this._onReportDeleted)

      this.setupSharedSocketListeners(socket)
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
    this.teardownSharedSocketListeners(socket)
  }
}
</script>

<style src="../styles/views/UserDashboard.scss" scoped lang="scss" />