<template>
  <div class="container">
    <div class="card">
      <h1>🌍 AnotherEcoApp</h1>
      <h2>Registrazione</h2>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <select v-model="role">
        <option value="user">Utente</option>
        <option value="admin">Admin</option>
      </select>
      <button @click="register">Registrati</button>
      <p>Hai già un account? <a @click="$router.push('/login')">Accedi</a></p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'RegisterView',
  data() {
    return { email: '', password: '', role: 'user', error: null, success: null }
  },
  methods: {
    async register() {
      try {
        await axios.post('http://localhost:3000/api/auth/register', {
          email: this.email, password: this.password, role: this.role
        })
        this.success = 'Registrazione avvenuta con successo!'
        this.error = null
        setTimeout(() => { this.$router.push('/login') }, 1500)
      } catch (err) {
        this.error = err.response?.data?.message || 'Errore durante la registrazione'
      }
    }
  }
}
</script>

<style src="../styles/views/RegisterView.scss" scoped lang="scss" />