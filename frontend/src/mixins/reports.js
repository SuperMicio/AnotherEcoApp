import api from '../services/api'

export default {
  data() {
    return {
      reports: [],
      currentPage: 1,
      totalPages: 1,
      total: 0,
      loading: true
    }
  },
  methods: {
    async fetchReports(filters = {}, silent = false) {
      if (!silent) this.loading = true
      try {
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: 10,
          ...filters
        })
        const res = await api.get(`/reports?${params}`)
        this.reports = res.data.reports
        this.totalPages = res.data.totalPages
        this.total = res.data.total

        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages
          await this.fetchReports(filters, silent)
        }
      } catch (err) {
        console.error('Errore caricamento segnalazioni:', err)
      } finally {
        if (!silent) this.loading = false
      }
    },
    async changePage(page) {
      this.currentPage = page
      await this.fetchReports(this.activeFilters || {})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}