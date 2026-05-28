<template>
  <div class="map-picker">
    <div class="map-picker-header">
      <span>📍 Posizione sulla mappa <span class="optional">(opzionale)</span></span>
      <button type="button" @click="toggle" class="toggle-btn">
        {{ show ? 'Nascondi mappa' : 'Aggiungi posizione' }}
      </button>
    </div>

    <div v-if="show">
      <p class="map-hint">Clicca sulla mappa per selezionare la posizione esatta</p>
      <div id="map-picker" class="map-container"></div>
      <div v-if="selected" class="coords-info">
        ✅ Posizione selezionata: {{ selected.lat.toFixed(5) }}, {{ selected.lng.toFixed(5) }}
        <button type="button" @click="clearSelection" class="clear-btn">✕ Rimuovi</button>
      </div>
    </div>
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

export default {
  name: 'MapPicker',
  props: {
    modelValue: { type: Object, default: null }
},
  emits: ['update:modelValue'],
  data() {
    return {
      show: false,
      map: null,
      marker: null,
      selected: null
    }
  },
  methods: {
    toggle() {
      this.show = !this.show
      if (this.show) {
        this.$nextTick(() => { this.initMap() })
      } else {
        this.destroyMap()
      }
    },
    initMap() {
      if (this.map) return
      this.map = L.map('map-picker').setView([44.1, 12.2], 10)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map)

      this.map.on('click', (e) => {
        const { lat, lng } = e.latlng
        this.selected = { lat, lng }
        this.$emit('update:modelValue', { lat, lng })

        if (this.marker) this.marker.remove()
        this.marker = L.marker([lat, lng]).addTo(this.map)
      })
    },
    destroyMap() {
      if (this.map) {
        this.map.remove()
        this.map = null
        this.marker = null
      }
    },
    clearSelection() {
      this.selected = null
      this.$emit('update:modelValue', null)
      if (this.marker) {
        this.marker.remove()
        this.marker = null
      }
    }
  },
  watch: {
    modelValue: {
        immediate: true,
        handler(val) {
        this.selected = val

        if (!val && this.marker) {
            this.marker.remove()
            this.marker = null
        }
        }
    }
    },
  unmounted() {
    this.destroyMap()
  }
}
</script>

<style src="../styles/components/MapPicker.scss" scoped lang="scss" />