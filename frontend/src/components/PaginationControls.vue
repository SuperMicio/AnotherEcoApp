<template>
  <div v-if="totalPages > 1" class="pagination">
    <button @click="$emit('change', currentPage - 1)" :disabled="currentPage === 1" class="page-btn">
      ← Precedente
    </button>
    <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
    <button @click="$emit('change', currentPage + 1)" :disabled="currentPage === totalPages" class="page-btn">
      Successiva →
    </button>
  </div>
</template>

<script>
export default {
  name: 'PaginationControls',
  props: {
    currentPage: { type: Number, required: true },
    totalPages: { type: Number, required: true }
  },
  emits: ['change']
}
</script>

<style src="../styles/components/PaginationControls.scss" scoped lang="scss" />