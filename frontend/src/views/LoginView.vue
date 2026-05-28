<template>
  <div class="container">
    <div class="card">
      <h1>🌍 AnotherEcoApp</h1>
      <h2>Login</h2>
      <div v-if="error" class="error">{{ error }}</div>
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="login">Accedi</button>
      <p>Non hai un account? <a @click="$router.push('/register')">Registrati</a></p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'LoginView',
  data() {
    return { email: '', password: '', error: null }
  },
  methods: {
    async login() {
      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          email: this.email, password: this.password
        })
        this.$store.commit('SET_USER', {
          token: response.data.token, role: response.data.role,
          email: response.data.email, userId: response.data.userId
        })
        this.$router.push(response.data.role === 'admin' ? '/admin' : '/home')
      } catch (err) {
        this.error = err.response?.data?.message || 'Errore durante il login'
      }
    }
  }
}
</script>

<style src="../styles/views/LoginView.scss" scoped lang="scss" />