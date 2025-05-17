<template>
  <div class="user-profile-container" v-if="otherUser || isLoading">
    <a-page-header class="custom-page-header" title="回首頁" @back="goTotop" />
    <a-spin :spinning="isLoading" tip="加載中...">
    <a-row :gutter="[32, 32]">
      <!-- Left Column - User Card -->
      <a-col :xs="24" :sm="24" :md="8" :lg="7">
        <div class="user-card-wrapper">
          <a-card :loading="isLoading" class="user-card" :bordered="false">
            <template #cover>
              <div class="cover-background">
                <div class="role-badge" v-if="otherUser?.role">
                  <a-tag :color="getRoleColor(otherUser?.role)" class="role-tag">{{ otherUser?.role }}</a-tag>
                </div>
              </div>
            </template>
            <div class="avatar-container">
              <a-avatar :size="120" :src="otherUser?.avatar" class="user-avatar">
                {{ otherUser?.una.charAt(0).toUpperCase() }}
              </a-avatar>
            </div>
            <template #title>
              <div class="text-center user-title">
                <h2 class="user-name">{{ otherUser?.una }}</h2>
              </div>
            </template>
            <a-divider />
            <a-descriptions :column="1" class="user-descriptions">
              <a-descriptions-item label="電子郵件" class="description-item">
                <a-typography-text copyable class="email-text">{{ otherUser?.email }}</a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item label="性別" class="description-item">
                <a-tag :color="otherUser?.usex === '1' ? 'blue' : 'pink'" class="gender-tag">
                  {{ otherUser?.usex === '1' ? '男' : '女' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="生日" class="description-item">
                <span class="birthday-text">{{ formatDate(otherUser?.birthday) }}</span>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </div>
      </a-col>

      <!-- Right Column - Tabs Content -->
      <a-col :xs="24" :sm="24" :md="16" :lg="17">
        <a-card :bordered="false" class="content-card">
          <a-tabs default-active-key="1" class="custom-tabs">
            <a-tab-pane key="2" tab="發布的貼文">
              <div class="tab-content">
                <a-list v-if="(userPosts ?? []).length > 0" class="post-list" :loading="loadingPosts"
                  item-layout="vertical" :data-source="userPosts">
                  <template #renderItem="{ item }">
                    <a-list-item class="post-list-item" @click="goToPost(item.pid)">
                      <template #actions>
                        <a-space>
                          <a-button type="link" class="action-button like-button">
                            <template #icon>
                              <HeartOutlined />
                            </template>
                            {{ item.favorites || 0 }}
                          </a-button>
                          <a-button type="link" class="action-button score-button">
                            <template #icon>
                              <StarOutlined />
                            </template>
                            {{ item.score || 0 }}分
                          </a-button>
                          <a-button type="link" class="action-button comment-button">
                            <template #icon>
                              <MessageOutlined />
                            </template>
                            {{ item.comm_count || 0 }}
                          </a-button>
                        </a-space>
                      </template>
                      <a-list-item-meta :title="item.title" :description="formatDate(item.crea_date)" class="post-meta">
                        <template #avatar>
                          <a-avatar :src="otherUser?.avatar" class="post-avatar">
                            {{ otherUser?.una.charAt(0).toUpperCase() }}
                          </a-avatar>
                        </template>
                      </a-list-item-meta>
                      <div class="post-content">
                        <span v-html="item.content"></span>
                      </div>
                    </a-list-item>
                  </template>
                </a-list>
                <a-empty v-else description="暫無發布的貼文" class="empty-state" />
              </div>
            </a-tab-pane>

            <!-- 個人資料 Tab -->
            <a-tab-pane key="3" tab="個人資料">
              <div class="tab-content">
                <a-descriptions bordered :column="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }" class="profile-descriptions">
                  <template v-if="!isEditing">
                    <a-descriptions-item label="用戶名稱" class="profile-item">
                      <span class="profile-value">{{ otherUser?.una }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="帳戶角色" class="profile-item">
                      <span class="profile-value">{{ otherUser?.role }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="電子郵件" class="profile-item">
                      <span class="profile-value">{{ otherUser?.email }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="性別" class="profile-item">
                      <span class="profile-value">{{ otherUser?.usex === '1' ? '男' : '女' }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="生日" class="profile-item">
                      <span class="profile-value">{{ formatDate(otherUser?.birthday) }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="註冊時間" class="profile-item">
                      <span class="profile-value">{{ formatDate(otherUser?.reg_date) }}</span>
                    </a-descriptions-item>
                  </template>
                  <template v-else>
                    <a-descriptions-item label="用戶名稱" class="profile-item">
                      <span class="profile-value">{{ otherUser?.una }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="帳戶角色" class="profile-item">
                      <span class="profile-value">{{ otherUser?.role }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="電子郵件" class="profile-item">
                      <a-input v-model:value="editForm.email" />
                    </a-descriptions-item>
                    <a-descriptions-item label="性別" class="profile-item">
                      <a-select v-model:value="editForm.usex" style="width: 100%">
                        <a-select-option value="1">男</a-select-option>
                        <a-select-option value="2">女</a-select-option>
                      </a-select>
                    </a-descriptions-item>
                    <a-descriptions-item label="生日" class="profile-item">
                      <a-date-picker v-model:value="editForm.birthday" style="width: 100%" />
                    </a-descriptions-item>
                    <a-descriptions-item label="註冊時間" class="profile-item">
                      <span class="profile-value">{{ formatDate(otherUser?.reg_date) }}</span>
                    </a-descriptions-item>
                  </template>
                </a-descriptions>
                <!-- 編輯按鈕和密碼修改按鈕 -->
                <div class="edit-buttons" v-if="isCurrentUser" style="margin-top: 16px; text-align: right;">
                  <a-space>
                    <template v-if="!isEditing">
                      <a-button type="primary" @click="startEditing">
                        編輯資料
                      </a-button>
                      <a-button type="primary" danger @click="showPasswordModal">
                        修改密碼
                      </a-button>
                    </template>
                    <template v-else>
                      <a-button @click="cancelEditing">
                        取消
                      </a-button>
                      <a-button type="primary" @click="saveChanges">
                        保存
                      </a-button>
                    </template>
                  </a-space>
                </div>
              </div>
            </a-tab-pane>

            <!-- 收藏的貼文 Tab -->
            <a-tab-pane key="4" tab="收藏的貼文">
              <div class="tab-content">
                <a-list v-if="(userFavorites ?? []).length > 0" class="post-list" :loading="loadingPosts" item-layout="vertical"
                  :data-source="userFavorites">
                  <template #renderItem="{ item }">
                    <a-list-item class="post-list-item" @click="goToPost(item.pid)">
                      <template #actions>
                        <a-space>
                          <a-button type="link" class="action-button like-button">
                            <template #icon>
                              <HeartOutlined />
                            </template>
                            {{ item.favorites || 0 }}
                          </a-button>
                          <a-button type="link" class="action-button score-button">
                            <template #icon>
                              <StarOutlined />
                            </template>
                            {{ item.score || 0 }}分
                          </a-button>
                          <a-button type="link" class="action-button comment-button">
                            <template #icon>
                              <MessageOutlined />
                            </template>
                            {{ item.comm_count || 0 }}
                          </a-button>
                        </a-space>
                      </template>
                      <a-list-item-meta :title="item.title" :description="formatDate(item.crea_date)" class="post-meta">
                        <template #avatar>
                          <a-avatar :src="otherUser?.avatar" class="post-avatar">
                            {{ otherUser?.una.charAt(0).toUpperCase() }}
                          </a-avatar>
                        </template>
                      </a-list-item-meta>
                      <div class="post-content">
                        <span v-html="item.content"></span>
                      </div>
                    </a-list-item>
                  </template>
                </a-list>
                <a-empty v-else description="暫無收藏的貼文" class="empty-state" />
              </div>
            </a-tab-pane>

          </a-tabs>
        </a-card>
      </a-col>
    </a-row>
    </a-spin>
    <!-- 預覽模態框 -->
    <a-modal :open="previewVisible" :title="previewTitle" :footer="null" @cancel="handleCancel" class="preview-modal">
      <img alt="example" style="width: 100%" :src="previewImage" />
    </a-modal>
    <!-- 密碼修改模態框 -->
    <a-modal
      v-model:visible="passwordModalVisible"
      title="修改密碼"
      @ok="handlePasswordChange"
      @cancel="handlePasswordCancel"
      :confirmLoading="passwordLoading"
    >
      <a-form :model="passwordForm" layout="vertical">
        <a-form-item
          label="目前密碼"
          name="currentPassword"
          :rules="[{ required: true, message: '請輸入目前密碼' }]"
        >
          <a-input-password v-model:value="passwordForm.currentPassword" placeholder="請輸入目前密碼" />
        </a-form-item>
        <a-form-item
          label="新密碼"
          name="newPassword"
          :rules="[{ required: true, message: '請輸入新密碼' }]"
        >
          <a-input-password v-model:value="passwordForm.newPassword" placeholder="請輸入新密碼" />
        </a-form-item>
        <a-form-item
          label="確認新密碼"
          name="confirmPassword"
          :rules="[{ required: true, message: '請確認新密碼' }]"
        >
          <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="請再次輸入新密碼" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useAuthStore } from '../stores/auth';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { HeartOutlined, StarOutlined, MessageOutlined, PlusOutlined, UserAddOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

// 是否為管理員用戶
const isAdminUser = computed(() => {
  return otherUser.value?.role === 'admin'
})

// 是否為當前登入用戶
const isCurrentUser = computed(() => {
  return authStore.userState.user?.uid === route.params.id;
});

// 編輯相關的狀態
const isEditing = ref(false);
const editForm = ref({
  email: '',
  usex: '',
  birthday: null as any
});

// 開始編輯
const startEditing = () => {
  editForm.value = {
    email: otherUser.value?.email || '',
    usex: otherUser.value?.usex || '',
    birthday: otherUser.value?.birthday ? dayjs(otherUser.value.birthday) : null
  };
  isEditing.value = true;
};

// 取消編輯
const cancelEditing = () => {
  isEditing.value = false;
};

// 保存更改
const saveChanges = async () => {
  try {
    const updatedData = {
      email: editForm.value.email,
      usex: editForm.value.usex,
      birthday: editForm.value.birthday ? editForm.value.birthday.format('YYYY-MM-DD') : null
    };

    // 呼叫 API 更新用戶資料
    const response = await axios.put(`http://localhost:8000/api/user/${route.params.id}`, updatedData);

    if (response.status === 200) {
      message.success('資料更新成功');
      // 重新獲取用戶資料
      await fetchUserData(route.params.id as string);
      isEditing.value = false;
    }
  } catch (error: any) {
    message.error(error.response?.data?.error || '更新失敗，請稍後再試');
  }
};

//計算屬性：獲取其他用戶信息
const otherUser = computed(() => authStore.userState.otherUser)
const userPosts = computed(() => authStore.postState.posts); // 用戶貼文數據
const userFavorites = computed(() => authStore.postState.favorites); // 用戶收藏的貼文數據
const loadingPosts = ref(true); // 貼文加載狀態

// 添加加載狀態標誌
const isLoading = ref(true);

// 獲取用戶貼文
const fetchUserPosts = async () => {
  loadingPosts.value = true;
  try {
    const userId = route.params.id as string; // 從路由參數獲取用戶 ID
    await authStore.getuserPosts(userId); // 調用 store 的方法獲取用戶貼文
    await authStore.getuserFavorites(userId); // 獲取用戶信息
  } catch (error) {
    console.error('Failed to fetch user posts:', error);
  } finally {
    loadingPosts.value = false;
  }
};

const goToPost = async (postId: string) => {
  try {
    await router.push({
      name: 'post',
      params: { id: postId }
    })
  } catch (error) {
    message.error('無法開啟貼文')
    console.error('Error navigating to post:', error)
  }
}

// 日期格式化函數
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// 根據用戶角色獲取對應的顏色
const getRoleColor = (role?: string) => {
  const roleColors: Record<string, string> = {
    'admin': '#f50',
    'moderator': '#108ee9',
    'user': '#87d068'
  }
  return roleColors[role ?? 'user']
}
const goTotop = () => {
  router.push("/");
};

// 圖片上傳相關邏輯
const fileList = ref([])
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')

const handlePreview = async (file: any) => {
  if (!file.url && !file.preview) {
    file.preview = await getBase64(file.originFileObj)
  }
  previewImage.value = file.url || file.preview
  previewVisible.value = true
  previewTitle.value = file.name || file.url.substring(file.url.lastIndexOf('/') + 1)
}

const handleCancel = () => {
  previewVisible.value = false
}

const beforeUpload = (file: any) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('You can only upload JPG/PNG file!')
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('Image must smaller than 2MB!')
  }
  return isJpgOrPng && isLt2M
}

const getBase64 = (file: any) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

// 在組件掛載時獲取用戶信息
onMounted(async () => {
  const userId = route.params.id as string
  await fetchUserData(userId)
})

// 添加重置數據的方法
const resetUserData = () => {
  // 使用直接賦值方式清空之前用戶的數據
  // 注意：這裡假設 authStore 有這些屬性，如果沒有需要根據實際情況調整
  if (authStore.postState) {
    authStore.postState.posts = [];
    authStore.postState.favorites = [];
  }
  if (authStore.userState) {
    authStore.userState.otherUser = null;
  }
};

// 封裝獲取用戶數據的方法
const fetchUserData = async (userId: string) => {
  isLoading.value = true;
  resetUserData(); // 先重置數據
  try {
    await authStore.getUserInfo(userId);
    await fetchUserPosts();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    // 錯誤處理，但不顯示錯誤訊息
  } finally {
    isLoading.value = false;
  }
};

// 監聽路由變化
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await fetchUserData(newId as string);
  }
});

// 密碼修改相關的狀態
const passwordModalVisible = ref(false);
const passwordLoading = ref(false);
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 顯示密碼修改模態框
const showPasswordModal = () => {
  passwordModalVisible.value = true;
};

// 處理密碼修改取消
const handlePasswordCancel = () => {
  passwordModalVisible.value = false;
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
};

// 處理密碼修改
const handlePasswordChange = async () => {
  try {
    // 基本驗證
    if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
      message.error('請填寫所有密碼欄位');
      return;
    }

    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      message.error('新密碼與確認密碼不符');
      return;
    }

    passwordLoading.value = true;

    // 呼叫 API 更新密碼
    const response = await axios.put(`http://localhost:8000/api/user/${route.params.id}/password`, {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    });

    if (response.status === 200) {
      message.success('密碼更新成功');
      handlePasswordCancel();
    }
  } catch (error: any) {
    message.error(error.response?.data?.error || '密碼更新失敗，請稍後再試');
  } finally {
    passwordLoading.value = false;
  }
};

</script>

<style scoped>
.user-profile-container {
  padding: 28px;
  background: linear-gradient(to bottom, #f9fafc, #f2f6fc);
  min-height: 100vh;
}

.custom-page-header {
  margin-bottom: 28px;
  border-radius: 10px;
  background-color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.3s;
  border: 1px solid rgba(235, 237, 240, 0.8);
}

.custom-page-header:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.user-card-wrapper {
  perspective: 1200px;
}

.user-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03);
  background: #ffffff;
  transform-origin: center center;
  will-change: transform;
}

.user-card:hover {
  transform: translateY(-8px) rotateX(2deg);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
}

.cover-background {
  height: 120px;
  background: linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%);
  position: relative;
  overflow: hidden;
}

.cover-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03MyAyMUg1OUw2OSAzMUg4M0w3MyAyMVoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNikiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTI3IDIxSDQxTDMxIDMxSDE3TDI3IDIxWiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA2KSIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNzMgNzlINTlMNjkgNjlIODNMNzMgNzlaIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDYpIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNyA3OUg0MUwzMSA2OUgxN0wyNyA3OVoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNikiLz48L3N2Zz4=') repeat;
  opacity: 0.3;
}

.role-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.avatar-container {
  display: flex;
  justify-content: center;
  margin-top: -60px;
  margin-bottom: 10px;
}

.user-avatar {
  border: 5px solid #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transition: all 0.4s;
  background: linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%);
}

.user-avatar:hover {
  transform: scale(1.05) rotate(3deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.user-title {
  padding-top: 10px;
}

.user-name {
  margin: 0 0 12px 0;
  font-size: 1.6rem;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.02em;
  text-align: center;
}

.role-tag {
  font-size: 0.9rem;
  padding: 2px 14px;
  border-radius: 16px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-descriptions {
  margin-top: 16px;
}

.description-item {
  padding: 10px 0;
  transition: all 0.3s;
}

.description-item:hover {
  background-color: #fafafa;
}

.email-text {
  color: #3a7bd5;
}

.gender-tag {
  padding: 2px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.birthday-text {
  color: #555;
}

.content-card {
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03);
  background: #ffffff;
  padding: 6px;
  min-height: 500px;
}

.custom-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 24px;
  padding: 0 12px;
}

.custom-tabs :deep(.ant-tabs-tab) {
  padding: 12px 20px;
  font-size: 1.05rem;
  transition: all 0.3s;
  margin-right: 8px;
  border-radius: 8px 8px 0 0;
}

.custom-tabs :deep(.ant-tabs-tab-active) {
  font-weight: 600;
  background-color: #f8faff;
}

.custom-tabs :deep(.ant-tabs-ink-bar) {
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(to right, #3a7bd5, #00d2ff);
}

.tab-content {
  padding: 12px 16px;
}

.post-list {
  margin-top: 20px;
}

.post-list-item {
  padding: 24px;
  background-color: #ffffff;
  border: 1px solid rgba(235, 237, 240, 0.8);
  border-radius: 16px;
  margin-bottom: 24px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.post-list-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(to bottom, #3a7bd5, #00d2ff);
  opacity: 0;
  transition: opacity 0.4s;
  border-radius: 4px;
}

.post-list-item:hover {
  background-color: #f8faff;
  border-color: rgba(24, 144, 255, 0.2);
  box-shadow: 0 10px 24px rgba(24, 144, 255, 0.1);
  transform: translateY(-8px) scale(1.01);
}

.post-list-item:hover::before {
  opacity: 1;
}

.post-meta {
  margin-bottom: 12px;
}

.post-meta :deep(.ant-list-item-meta-title) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
  transition: color 0.3s;
}

.post-list-item:hover .post-meta :deep(.ant-list-item-meta-title) {
  color: #3a7bd5;
}

.post-meta :deep(.ant-list-item-meta-description) {
  color: #8c8c8c;
  font-size: 0.9rem;
}

.post-avatar {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  border: 2px solid white;
}

.post-content {
  margin-top: 12px;
  line-height: 1.7;
  color: #5c5c5c;
  max-height: 100px;
  overflow: hidden;
  position: relative;
  font-size: 1rem;
}

.post-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background: linear-gradient(transparent, #ffffff);
  pointer-events: none;
}

.action-button {
  padding: 4px 8px;
  color: #8c8c8c;
  transition: all 0.3s;
  border-radius: 8px;
}

.action-button:hover {
  background-color: rgba(24, 144, 255, 0.06);
  transform: scale(1.1);
}

.like-button:hover {
  color: #f5222d;
}

.score-button:hover {
  color: #faad14;
}

.comment-button:hover {
  color: #52c41a;
}

.profile-descriptions {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(235, 237, 240, 0.8);
}

.profile-descriptions :deep(.ant-descriptions-row) {
  transition: background-color 0.3s;
}

.profile-descriptions :deep(.ant-descriptions-row:hover) {
  background-color: #f8faff;
}

.profile-descriptions :deep(.ant-descriptions-item-label) {
  background-color: #f8f9fa;
  font-weight: 500;
  color: #555;
  padding: 16px 24px;
}

.profile-descriptions :deep(.ant-descriptions-item-content) {
  padding: 16px 24px;
}

.profile-value {
  color: #303133;
}

.empty-state {
  margin: 60px 0;
  padding: 30px;
  background: #f9fafc;
  border-radius: 16px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.02);
}

.preview-modal {
  border-radius: 16px;
  overflow: hidden;
}

.preview-modal :deep(.ant-modal-content) {
  border-radius: 16px;
  overflow: hidden;
}

/* RWD adjustments */
@media (max-width: 768px) {
  .user-profile-container {
    padding: 20px;
  }
  
  .user-card, .content-card {
    border-radius: 12px;
  }
  
  .post-list-item {
    padding: 18px;
    margin-bottom: 18px;
    border-radius: 12px;
  }
  
  .user-name {
    font-size: 1.4rem;
    margin-top: 45px;
  }
  
  .cover-background {
    height: 100px;
  }
  
  .avatar-container {
    margin-top: -50px;
  }
  
  .user-avatar {
    border-width: 4px;
  }

  .custom-tabs :deep(.ant-tabs-tab) {
    padding: 10px 14px;
    font-size: 1rem;
  }
  
  .tab-content {
    padding: 8px 12px;
  }
}

@media (max-width: 480px) {
  .user-profile-container {
    padding: 16px;
  }
  
  .custom-page-header {
    margin-bottom: 18px;
  }
  
  .post-list-item {
    padding: 16px;
    border-radius: 10px;
  }
  
  .post-meta :deep(.ant-list-item-meta-title) {
    font-size: 1.1rem;
  }
  
  .user-name {
    font-size: 1.3rem;
    margin-top: 40px;
  }
  
  .role-tag {
    font-size: 0.85rem;
    padding: 2px 10px;
  }
  
  .cover-background {
    height: 80px;
  }
  
  .avatar-container {
    margin-top: -40px;
  }
  
  .post-content {
    font-size: 0.95rem;
    line-height: 1.6;
    max-height: 80px;
  }
  
  .action-button {
    padding: 2px 6px;
  }
}
</style>