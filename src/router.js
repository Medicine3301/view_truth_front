import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Home from './components/Home.vue'
import Register from './components/Register.vue'
import Userprofile from './components/Userprofile.vue'
import Community from './components/community.vue'
import Post from './components/post.vue'
import Newspage from './components/newspage.vue'
import AdminUserManagement from './components/AdminUserManagement.vue'
import HotNewsList from './components/HotNewsList.vue'
import WebsiteAnalytics from './components/WebsiteAnalytics.vue'
import ContentAnalysisManagement from './components/ContentAnalysisManagement.vue'
const routes = [
    { 
        path: '/', 
        component: Home, 
        name: 'home',
        meta: { requiresAuth: false }
    },
    { 
        path: '/register', 
        component: Register, 
        name: 'register',
        meta: { requiresAuth: false }
    },
    { 
        path: '/newspage/:id', 
        component: Newspage, 
        name: 'newspage',
        meta: { requiresAuth: false }
    },
    { 
        path: '/userprofile/:id', 
        component: Userprofile, 
        name: 'userprofile',
        meta: { requiresAuth: false}
    },
    { 
        path: '/community/:id', 
        component: Community, 
        name: 'community',
        meta: { requiresAuth: false }
    },
    { 
        path: '/post/:id', 
        component: Post, 
        name: 'post',
        meta: { requiresAuth: false }
    },
    { 
        path: '/hotnewslist', 
        component: HotNewsList, 
        name: 'hotnewslist',
        meta: { requiresAuth: false }
    },
    { 
        path: '/adminusermanagement', 
        component: AdminUserManagement, 
        name: 'adminusermanagement',
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/adminanalytics',
        component: WebsiteAnalytics,
        name: 'adminanalytics',
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admincontentanalysis',
        component: ContentAnalysisManagement,
        name: 'admincontentanalysis',
        meta: { requiresAuth: true, requiresAdmin: true }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

// 修改全局路由守衛
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const token = localStorage.getItem('token') || authStore.tokenState.accessToken

    if (to.meta.requiresAuth) {
        if (!token) {
            notification.error({
                message: '請先登入',
                description: '此頁面需要登入才能訪問',
                duration: 3
            });
            return next('/')
        }

        try {
            const isAuthenticated = await authStore.checkAuth()
            console.log('[Router Guard] isAuthenticated:', isAuthenticated);
            // 使用 JSON.stringify 和 JSON.parse 來確保我們得到的是一個乾淨的物件副本，避免直接打印 Proxy 物件
            console.log('[Router Guard] authStore.userState.user (before admin check):', JSON.parse(JSON.stringify(authStore.userState.user)));
            
            if (!isAuthenticated) {
                notification.error({
                    message: '認證失敗',
                    description: '請重新登入',
                    duration: 3
                });
                return next('/')
            }

            // 檢查管理員權限
            if (to.meta.requiresAdmin) {
                console.log('[Router Guard] Checking admin. User role from store:', authStore.userState.user?.role);
                if (authStore.userState.user?.role !== 'admin') {
                    notification.error({
                        message: '權限不足',
                        description: '此頁面需要管理員權限',
                        duration: 3
                    });
                    return next('/')
                }
            }

            return next()
        } catch (error) {
            console.error('[Router Guard] Error:', error)
            return next('/')
        }
    }
    
    next()
})

export default router
