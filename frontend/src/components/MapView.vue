<template>
  <div v-if="coordinates?.lat && coordinates?.lng" class="map-view">
    <h3>📍 Posizione sulla mappa</h3>
    <div :id="mapId" class="map-container"></div>
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
  name: 'MapView',
  props: {
    coordinates: { type: Object, default: null },
    mapId: { type: String, default: 'map-view' }
  },
  data() {
    return { map: null }
  },
  methods: {
    initMap() {
      if (!this.coordinates?.lat || !this.coordinates?.lng) return
      if (this.map) { this.map.remove(); this.map = null }

      this.$nextTick(() => {
        this.map = L.map(this.mapId).setView(
          [this.coordinates.lat, this.coordinates.lng], 15
        )
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map)

        L.marker([this.coordinates.lat, this.coordinates.lng]).addTo(this.map)
      })
    }
  },
  watch: {
    coordinates: {
      immediate: true,
      handler(val) {
        if (val?.lat && val?.lng) {
          this.$nextTick(() => { this.initMap() })
        }
      }
    }
  },
  unmounted() {
    if (this.map) { this.map.remove(); this.map = null }
  }
}
</script>

<style src="../styles/components/MapView.scss" scoped lang="scss" />