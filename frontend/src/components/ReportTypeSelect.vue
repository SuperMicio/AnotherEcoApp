<template>
  <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
    <option value="">{{ placeholder }}</option>
    <option value="water">💧 Corsi d'acqua</option>
    <option value="road">🛣️ Pavimentazione stradale</option>
    <option value="soil">🌱 Stato del suolo</option>
    <option value="trees">🌳 Alberi e piante</option>
    <option value="light">💡 Luminosità aree cittadine</option>
    <option value="noise">🔊 Inquinamento acustico</option>
    <option value="air">💨 Inquinamento atmosferico</option>
  </select>
</template>

<script>
export default {
  name: 'ReportTypeSelect',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Seleziona tipo' }
  },
  emits: ['update:modelValue']
}
</script>