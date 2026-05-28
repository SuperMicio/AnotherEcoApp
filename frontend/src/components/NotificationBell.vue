<template>
  <div class="bell-wrapper" @click.stop="toggle">
    <span class="bell-icon">🔔</span>
    <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount }}</span>
    <div v-if="showDropdown" class="notifications-dropdown">
      <div class="notifications-header">
        <strong>Notifiche</strong>
        <span @click.stop="clear" class="clear-btn">Cancella tutto</span>
      </div>
      <div v-if="notifications.length === 0" class="no-notifications">Nessuna notifica</div>
      <div
        v-for="(notif, index) in notifications"
        :key="index"
        class="notification-item"
        @click.stop="handleClick(notif)"
      >
        <span>{{ notif.message }}</span>
        <span class="notif-time">{{ notif.time }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationBell',
  props: { notifications: { type: Array, default: () => [] } },
  emits: ['clear', 'notification-click'],
  data() { return { showDropdown: false } },
  computed: {
    unreadCount() { return this.$store.getters.getUnreadCount }
  },
  methods: {
    toggle(event) {
      event.stopPropagation()
      this.showDropdown = !this.showDropdown
      if (this.showDropdown) this.$store.commit('RESET_UNREAD')
    },
    close() { this.showDropdown = false },
    clear() {
      this.showDropdown = false
      this.$emit('clear')
    },
    handleClick(notif) {
      this.showDropdown = false
      this.$emit('notification-click', notif)
    }
  },
  mounted() { document.addEventListener('click', this.close) },
  unmounted() { document.removeEventListener('click', this.close) }
}
</script>

<style src="../styles/components/NotificationBell.scss" scoped lang="scss" />