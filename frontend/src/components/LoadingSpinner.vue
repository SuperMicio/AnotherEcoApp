<template>
  <div class="spinner-wrapper">
    <div class="spinner"></div>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    message: { type: String, default: 'Caricamento...' }
  }
}
</script>

<style src="../styles/components/LoadingSpinner.scss" scoped lang="scss" />