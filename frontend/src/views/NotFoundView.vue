<template>
  <div class="container">
    <div class="card">
      <span class="icon">🌍</span>
      <h1>404</h1>
      <h2>Pagina non trovata</h2>
      <p>La pagina che stai cercando non esiste.</p>
      <button @click="$router.push(isAdmin ? '/admin' : '/dashboard')">
        Torna alla dashboard
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView',
  computed: {
    isAdmin() { return this.$store.getters.isAdmin }
  }
}
</script>

<style src="../styles/views/NotFoundView.scss" scoped lang="scss" />