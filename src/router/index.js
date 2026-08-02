import { supabase } from '@/services/supabase.js'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../view/Dashboard.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../view/auth/Register.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../view/auth/Login.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../view/category/Index.vue')
    },
    {
      path: '/categories/create',
      name: 'categoriesCreate',
      component: () => import('../view/category/Create.vue')
    },
    {
      path: '/categories/edit/:id',
      name: 'categoriesEdit',
      component: () => import('../view/category/Create.vue')
    },
    {
      path: '/items',
      name: 'items',
      component: () => import('../view/item/Index.vue')
    },
    {
      path: '/items/create',
      name: 'itemsCreate',
      component: () => import('../view/item/Create.vue')
    },
    {
      path: '/items/edit/:id',
      name: 'itemsEdit',
      component: () => import('../view/item/Create.vue')
    },

  ],
})

router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getSession()
  const isAuthenticated = !!data.session
  if (to.meta.guestOnly && isAuthenticated) {
    return next('/')
  }
  next()
})

export default router
