<template>
  <div>
    <div v-if="reports.length === 0" class="empty">Nessuna segnalazione trovata</div>
    <div
      v-for="report in reports"
      :key="report._id"
      :id="'report-' + report._id"
      class="report-item"
      :class="{ 'new-report': report.isNew, 'updated-report': report.isUpdated }"
      @click="$router.push('/report/' + report._id)"
    >
      <div class="report-header">
        <span class="report-type">{{ typeLabel(report.type) }}</span>
        <span :class="'status status--' + report.status">{{ statusLabel(report.status) }}</span>
      </div>
      <p v-if="showUser" class="report-meta">👤 {{ report.user?.email }}</p>
      <p class="report-meta">📍 {{ report.location }}</p>
      <p class="report-description">{{ report.description }}</p>
      <p class="report-date">{{ formatDate(report.createdAt) }}</p>
      <div class="report-reactions">
        <span>👍 {{ report.likes?.length || 0 }}</span>
        <span>👎 {{ report.dislikes?.length || 0 }}</span>
        <span>💬 {{ report.commentsCount || 0 }}</span>
      </div>
      <div v-if="report.aiAnalysis?.severity" class="ai-badge">
        <span :class="'severity severity--' + report.aiAnalysis.severity">
          {{ severityLabel(report.aiAnalysis.severity) }}
        </span>
        <span v-if="report.aiAnalysis.isFake" class="fake-badge">⚠️ Possibile fake</span>
      </div>
      <div v-if="showActions && report.status === 'pending'" class="actions" @click.stop>
        <button @click="$emit('approve', report._id)" class="btn--approve">✅ Approva</button>
        <button @click="$emit('reject', report._id)" class="btn--reject">❌ Rifiuta</button>
      </div>
    </div>
  </div>
</template>

<script>
import commonMixin from '../mixins/common'

export default {
  name: 'ReportList',
  mixins: [commonMixin],
  props: {
    reports: { type: Array, default: () => [] },
    showUser: { type: Boolean, default: false },
    showActions: { type: Boolean, default: false }
  },
  emits: ['approve', 'reject'],
  methods: {
    severityLabel(severity) {
      const labels = {
        bassa: '🟢 Bassa gravità',
        media: '🟡 Media gravità',
        alta: '🔴 Alta gravità'
      }
      return labels[severity] || severity
    }
  }
}
</script>

<style src="../styles/components/ReportList.scss" scoped lang="scss" />