<template>
  <div class="container">
    <app-header title="Utenti" :show-back="true" />
    <div class="content">
      <div class="card">
        <h2>👥 Gestione Utenti</h2>
        <div v-if="users.length === 0" class="empty">Nessun utente trovato</div>
        <div v-for="user in users" :key="user._id" class="user-item">
          <div class="user-row">
            <span class="user-email">{{ user.email }}</span>
            <span :class="['badge', user.banned ? 'badge--banned' : 'badge--active']">
              {{ user.banned ? '🚫 Bannato' : '✅ Attivo' }}
            </span>
          </div>
          <p class="user-date">Registrato il {{ formatDate(user.createdAt) }}</p>
          <div class="actions">
            <button @click="toggleBan(user)" :class="user.banned ? 'btn btn--unban' : 'btn btn--ban'">
              {{ user.banned ? '✅ Rimuovi ban' : '🚫 Banna' }}
            </button>
            <button @click="deleteUser(user._id)" class="btn btn--delete">🗑️ Elimina</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
import commonMixin from '../mixins/common'
import AppHeader from '../components/AppHeader.vue'

export default {
  name: 'AdminUsers',
  components: { AppHeader },
  mixins: [commonMixin],
  data() { return { users: [] } },
  methods: {
    async fetchUsers() {
      try {
        const res = await api.get('/users')
        this.users = res.data
      } catch (err) {
        console.error('Errore caricamento utenti:', err)
      }
    },
    async toggleBan(user) {
      try {
        await api.patch(`/users/${user._id}/ban`, {})
        await this.fetchUsers()
      } catch (err) {
        console.error('Errore ban:', err)
      }
    },
    async deleteUser(id) {
      if (!confirm('Eliminare questo utente?')) return
      try {
        await api.delete(`/users/${id}`)
        await this.fetchUsers()
      } catch (err) {
        console.error('Errore eliminazione:', err)
      }
    },
    setupSocketListeners() {
      const socket = this.$store.getters.getSocket
      if (!socket) return

      this._onUserBanned = (data) => {
        const user = this.users.find(u => u._id.toString() === data.userId.toString())
        if (user) user.banned = data.banned
      }
      this._onUserDeleted = (data) => {
        this.users = this.users.filter(u => u._id.toString() !== data.userId.toString())
      }
      this._onUserRegistered = (data) => {
        this.users.unshift(data)
      }

      socket.on('user-registered', this._onUserRegistered)
      socket.on('user-banned', this._onUserBanned)
      socket.on('user-deleted', this._onUserDeleted)
    }
  },
  mounted() {
    this.fetchUsers()
    this.setupSocketListeners()
  },
  unmounted() {
    const socket = this.$store.getters.getSocket
    if (!socket) return
    socket.off('user-banned', this._onUserBanned)
    socket.off('user-deleted', this._onUserDeleted)
    socket.off('user-registered', this._onUserRegistered)
  }
}
</script>

<style src="../styles/views/AdminUsers.scss" scoped lang="scss" />