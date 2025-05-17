<template>
  <router-view v-if="isReady" />
  <div v-else class="loading-container">
    <div class="loading-spinner"></div>
    <div class="loading-text">載入中...</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { notification } from 'ant-design-vue'
import { useRouter } from 'vue-router'

const isReady = ref(false)
const authStore = useAuthStore()
const router = useRouter()

// 檢查localStorage中是否有可能無效的token
function checkAndCleanLocalStorage() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken || refreshToken) {
        console.log('App.vue: 發現已存儲的 token，檢查其有效性');
        
        // 簡單檢查JWT格式
        const isValidJWT = (token) => {
            return token && 
                   typeof token === 'string' && 
                   token.split('.').length === 3;
        };
        
        if (!isValidJWT(accessToken)) {
            console.warn('App.vue: access token 格式無效，清除');
            localStorage.removeItem('accessToken');
        }
        
        if (!isValidJWT(refreshToken)) {
            console.warn('App.vue: refresh token 格式無效，清除');
            localStorage.removeItem('refreshToken');
        }
        
        // 檢查token是否為空白或明顯無效
        if (accessToken === 'undefined' || accessToken === 'null' || 
            refreshToken === 'undefined' || refreshToken === 'null') {
            console.warn('App.vue: 發現無效的 token 值，清除');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    } else {
        console.log('App.vue: 未發現已存儲的 token');
    }
}

// 處理初始路由
function handleInitialRouting(isAuthenticated) {
    // 獲取當前路徑
    const currentPath = window.location.pathname;
    
    // 只有在以下情況才重定向到登入頁面：
    // 1. 用戶未認證
    // 2. 當前不在登入頁或註冊頁
    // 3. 當前是需要認證的頁面（可根據需要添加更多判斷）
    const publicPages = ['/login', '/register', '/forgot-password', '/', '/news', '/about'];
    const isPublicPage = publicPages.some(page => currentPath.startsWith(page));
    
    if (!isAuthenticated && !isPublicPage) {
        console.log('App.vue: 未授權訪問受保護頁面，重定向到登入');
        // 使用延遲確保應用完全載入後再跳轉
        setTimeout(() => {
            router.push('/login');
        }, 100);
    }
}

onMounted(async () => {
    console.log('App.vue: 應用初始化開始');
    
    // 先檢查並清理潛在的無效 token
    checkAndCleanLocalStorage();
    
    try {
        // 初始化認證狀態
        const success = await authStore.initAuth();
        console.log('App.vue: 認證初始化', success ? '成功' : '失敗或無token');
        
        // 根據認證狀態決定初始路由
        handleInitialRouting(success);
        
        if (!success) {
            // 無需顯示錯誤，這是正常情況
            console.log('App.vue: 用戶未登入狀態');
        }
    } catch (error) {
        console.error('App.vue: 認證初始化時發生錯誤:', error);
        
        // 判斷是否為網絡錯誤
        if (!error.response) {
            notification.error({
                message: '網絡連接問題',
                description: '無法連接到伺服器，請檢查您的網絡連接',
                duration: 5
            });
        } else if (error.response.status === 401) {
            // 401錯誤表示token已過期或無效
            console.log('App.vue: Token已過期或無效');
            // 這種情況無需顯示錯誤通知，因為auth store已經處理了
        } else {
            // 其他錯誤
            notification.error({
                message: '初始化失敗',
                description: '系統初始化出現問題，請稍後再試',
                duration: 5
            });
        }
        
        // 確保用戶已登出
        authStore.logout();
    } finally {
        // 延遲一小段時間再完成載入，避免畫面閃爍
        setTimeout(() => {
            isReady.value = true;
            console.log('App.vue: 應用初始化完成');
        }, 300);
    }
})
</script>

<style>
@import './style.css';
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.loading-text {
  font-size: 18px;
  color: #333;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

<!-- 根组件：作为整个应用的容器，使用 router-view 显示当前路由对应的组件 -->

<!--
這是主應用組件。
它只包含一個<router-view>組件,用於顯示當前路由對應的組件。
樣式部分引入了全局樣式文件style.css。
-->