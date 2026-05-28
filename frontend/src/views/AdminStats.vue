<template>
  <div class="container">
    <app-header title="Statistiche" :show-back="true" />
    <div class="content" v-if="stats">
      <div class="stats-grid">
        <div class="stat-card stat-card--total">
          <span class="stat-number">{{ stats.total }}</span>
          <span class="stat-label">Totale segnalazioni</span>
        </div>
        <div class="stat-card stat-card--pending">
          <span class="stat-number">{{ stats.pending }}</span>
          <span class="stat-label">⏳ In attesa</span>
        </div>
        <div class="stat-card stat-card--approved">
          <span class="stat-number">{{ stats.approved }}</span>
          <span class="stat-label">✅ Approvate</span>
        </div>
        <div class="stat-card stat-card--rejected">
          <span class="stat-number">{{ stats.rejected }}</span>
          <span class="stat-label">❌ Rifiutate</span>
        </div>
      </div>
      <div class="card">
        <h2>📊 Segnalazioni per tipo</h2>
        <div v-for="item in stats.byType" :key="item._id" class="type-row">
          <span class="type-label">{{ typeLabel(item._id) }}</span>
          <div class="bar-wrapper">
            <div class="bar" :style="{ width: barWidth(item.count) + '%' }"></div>
          </div>
          <span class="type-count">{{ item.count }}</span>
        </div>
      </div>
    </div>
    <div v-else class="loading">Caricamento...</div>
  </div>
</template>

<script>
import api from '../services/api'
import commonMixin from '../mixins/common'
import AppHeader from '../components/AppHeader.vue'

export default {
  name: 'AdminStats',
  components: { AppHeader },
  mixins: [commonMixin],
  data() { return { stats: null } },
  methods: {
    async fetchStats() {
      try { const res = await api.get('/reports/admin/stats'); this.stats = res.data }
      catch (err) { console.error('Errore statistiche:', err) }
    },
    barWidth(count) {
      const max = Math.max(...this.stats.byType.map(t => t.count))
      return max === 0 ? 0 : (count / max) * 100
    },
    setupSocketListeners() {
      const socket = this.$store.getters.getSocket
      if (!socket) return
      this._onUpdate = () => { this.fetchStats() }
      socket.on('new-report', this._onUpdate)
      socket.on('report-updated', this._onUpdate)
      socket.on('report-deleted', this._onUpdate)
    }
  },
  mounted() { this.fetchStats(); this.setupSocketListeners() },
  unmounted() {
    const socket = this.$store.getters.getSocket
    if (!socket) return
    socket.off('new-report', this._onUpdate)
    socket.off('report-updated', this._onUpdate)
    socket.off('report-deleted', this._onUpdate)
  }
}
</script>

<style src="../styles/views/AdminStats.scss" scoped lang="scss" />