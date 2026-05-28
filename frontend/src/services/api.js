import axios from 'axios'
import store from '../store'

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => {
    store.commit('SET_OFFLINE', false)
    return response
  },
  error => {
    if (!error.response) {
      store.commit('SET_OFFLINE', true)
    } else {
      store.commit('SET_OFFLINE', false)
      if (error.response?.status === 403 && error.response?.data?.message === 'Utente bannato') {
        store.commit('LOGOUT')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api