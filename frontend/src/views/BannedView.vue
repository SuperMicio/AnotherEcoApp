<template>
  <div class="container">
    <div class="header">
      <h1>🌍 AnotherEcoApp</h1>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>
    <div class="content">
      <div class="card">
        <span class="icon">🚫</span>
        <h2>Account Bannato</h2>
        <p>Il tuo account è stato bannato da un amministratore.</p>
        <button @click="logout">Logout</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BannedView',
  methods: {
    logout() {
      this.$store.commit('LOGOUT')
      this.$router.push('/login')
    }
  }
}
</script>

<style src="../styles/views/BannedView.scss" scoped lang="scss" />