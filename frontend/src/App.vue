<template>
  <router-view />
</template>

<script>
export default {
  name: 'App',
  watch: {
    '$store.state.token'(newToken) {
      if (newToken) this.$store.dispatch('initSocket')
      else this.$store.dispatch('disconnectSocket')
    },
    '$store.state.banned'(isBanned) {
      if (isBanned) this.$router.push('/banned')
    }
  },
  mounted() {
    if (this.$store.state.token) {
      this.$store.dispatch('initSocket')
    }
  }
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f0; }
</style>