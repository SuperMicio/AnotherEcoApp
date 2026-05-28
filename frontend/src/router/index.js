import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import UserDashboard from '../views/UserDashboard.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import ReportDetail from '../views/ReportDetail.vue'
import AdminUsers from '../views/AdminUsers.vue'
import AdminStats from '../views/AdminStats.vue'
import BannedView from '../views/BannedView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/banned', component: BannedView },
  {
    path: '/home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    component: UserDashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/report/:id',
    component: ReportDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    component: AdminUsers,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/stats',
    component: AdminStats,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { path: '/:pathMatch(.*)*', component: NotFoundView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !store.getters.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && !store.getters.isAdmin) {
    next('/home')
  } else {
    next()
  }
})

export default router