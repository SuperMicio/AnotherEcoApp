export default {
  methods: {
    typeLabel(type) {
      const labels = {
        water: '💧 Corsi d\'acqua', road: '🛣️ Pavimentazione',
        soil: '🌱 Suolo', trees: '🌳 Alberi',
        light: '💡 Luminosità', noise: '🔊 Rumore', air: '💨 Aria'
      }
      return labels[type] || type
    },
    statusLabel(status) {
      const labels = {
        pending: '⏳ In attesa',
        approved: '✅ Approvata',
        rejected: '❌ Rifiutata'
      }
      return labels[status] || status
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    }
  }
}