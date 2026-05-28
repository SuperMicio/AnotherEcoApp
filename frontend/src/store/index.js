import { createStore } from 'vuex'
import { io } from 'socket.io-client'

export default createStore({
  state: {
    token: localStorage.getItem('token') || null,
    role: localStorage.getItem('role') || null,
    email: localStorage.getItem('email') || null,
    userId: localStorage.getItem('userId') || null,
    socket: null,
    notifications: [],
    unreadCount: 0,
    banned: false,
    offline: false
  },
  mutations: {
    SET_USER(state, { token, role, email, userId }) {
      state.token = token
      state.role = role
      state.email = email
      state.userId = userId
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
      localStorage.setItem('email', email)
      localStorage.setItem('userId', userId)
    },
    LOGOUT(state) {
      state.token = null
      state.role = null
      state.email = null
      state.userId = null
      state.notifications = []
      state.unreadCount = 0
      state.banned = false
      state.offline = false
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('email')
      localStorage.removeItem('userId')
      if (state.socket) {
        state.socket.disconnect()
        state.socket = null
      }
    },
    SET_SOCKET(state, socket) {
      state.socket = socket
    },
    ADD_NOTIFICATION(state, notification) {
      state.notifications.unshift(notification)
      state.unreadCount++
    },
    CLEAR_NOTIFICATIONS(state) {
      state.notifications = []
      state.unreadCount = 0
    },
    RESET_UNREAD(state) {
      state.unreadCount = 0
    },
    SET_BANNED(state) {
      state.banned = true
    },
    SET_OFFLINE(state, value) {
      state.offline = value
    }
  },
  actions: {
    initSocket({ commit, state }) {
      if (state.socket?.connected) return
      if (state.socket) {
        state.socket.disconnect()
        commit('SET_SOCKET', null)
      }

      const socket = io('http://localhost:3000')
      commit('SET_SOCKET', socket)

      socket.on('new-report', (report) => {
        if (state.role === 'admin') {
          commit('ADD_NOTIFICATION', {
            message: `Nuova segnalazione: ${report.type} - ${report.location}`,
            time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            reportId: report.id,
            type: 'new-report'
          })
        }
      })

      socket.on('report-updated', (data) => {
        if (data.ownerId === state.userId) {
          commit('ADD_NOTIFICATION', {
            message: `Segnalazione ${data.status === 'approved' ? 'approvata ✅' : 'rifiutata ❌'}`,
            time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            reportId: data.id,
            type: 'report-updated'
          })
        }
      })

      socket.on('new-comment', (data) => {
        if (data.notifyOwner && data.reportOwnerId === state.userId) {
          commit('ADD_NOTIFICATION', {
            message: `Nuovo commento: "${data.comment.text.substring(0, 30)}..."`,
            time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            reportId: data.reportId,
            type: 'new-comment'
          })
        }
      })

      socket.on('user-banned', (data) => {
        if (data.userId === state.userId && data.banned) {
          commit('SET_BANNED')
        }
      })

      socket.on('user-deleted', (data) => {
        if (data.userId === state.userId) {
          commit('LOGOUT')
          window.location.href = '/login'
        }
      })
    },
    disconnectSocket({ commit, state }) {
      if (state.socket) {
        state.socket.disconnect()
        commit('SET_SOCKET', null)
      }
    }
  },
  getters: {
    isAuthenticated: state => !!state.token,
    isAdmin: state => state.role === 'admin',
    getToken: state => state.token,
    getEmail: state => state.email,
    getUserId: state => state.userId,
    getSocket: state => state.socket,
    getNotifications: state => state.notifications,
    getUnreadCount: state => state.unreadCount,
    isOffline: state => state.offline
  }
})