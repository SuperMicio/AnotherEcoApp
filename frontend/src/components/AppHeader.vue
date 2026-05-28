<template>
  <div>
    <div class="header" :style="{ backgroundColor: color }">
      <div class="header-left">
        <button v-if="showBack" @click="$router.back()" class="back-btn">← Indietro</button>
        <h1 @click="goHome" class="app-title">
          🌍 AnotherEcoApp<span v-if="title"> - {{ title }}</span>
        </h1>
      </div>
      <div class="user-info">
        <span class="user-email" @click="goProfile">{{ email }}</span>
        <notification-bell
          :notifications="notifications"
          @clear="clearNotifications"
          @notification-click="handleNotificationClick"
        />
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </div>
    <div v-if="isOffline" class="offline-banner">
      ⚠️ Connessione al server persa - riprova tra qualche secondo
    </div>
  </div>
</template>

<script>
import NotificationBell from './NotificationBell.vue'

export default {
  name: 'AppHeader',
  components: { NotificationBell },
  props: {
    title: { type: String, default: '' },
    showBack: { type: Boolean, default: false }
  },
  computed: {
    email() { return this.$store.state.email },
    color() { return this.$store.getters.isAdmin ? '#1a237e' : '#2e7d32' },
    notifications() { return this.$store.getters.getNotifications },
    isOffline() { return this.$store.getters.isOffline },
    isAdmin() { return this.$store.getters.isAdmin }
  },
  methods: {
    goHome() {
      this.$router.push(this.isAdmin ? '/admin' : '/home')
    },
    goProfile() {
      if (!this.isAdmin) this.$router.push('/dashboard')
    },
    clearNotifications() { this.$store.commit('CLEAR_NOTIFICATIONS') },
    handleNotificationClick(notif) {
      if (this.$route.path === `/report/${notif.reportId}`) {
        this.$router.go(0)
      } else {
        this.$router.push(`/report/${notif.reportId}`)
      }
    },
    logout() {
      this.$store.dispatch('disconnectSocket')
      this.$store.commit('LOGOUT')
      this.$router.push('/login')
    }
  }
}
</script>

<style src="../styles/components/AppHeader.scss" scoped lang="scss" />