<template>
  <a-layout>
    <Sidebar v-model:collapsed="collapsed" :onCollapse="onCollapse" />
    <a-layout :style="{ marginLeft: layoutMargin }">
      <Header />
      <a-layout-content :style="{ background: '#ececec', margin: '24px 16px 0' }">
        <!-- 數據概覽卡片 -->
        <div class="overview-cards">
          <a-row :gutter="16">
            <a-col :span="6">
              <a-card>
                <a-statistic title="總用戶數" :value="statistics.totalUsers" :value-style="{ color: '#3f8600' }">
                  <template #prefix>
                    <TeamOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic title="本月新增" :value="statistics.monthlyNewUsers" :value-style="{ color: '#0050b3' }">
                  <template #prefix>
                    <UserAddOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic title="待處理檢舉" :value="statistics.pendingReports" :value-style="{ color: '#cf1322' }">
                  <template #prefix>
                    <WarningOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic title="今日活躍" :value="statistics.todayActiveUsers" :value-style="{ color: '#1890ff' }">
                  <template #prefix>
                    <LineChartOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
          </a-row>
        </div>

        <!-- 搜尋區域 -->
        <a-card class="search-area" :style="{ background: '#f7f7f7', border: '1px solid #d9d9d9' }">
          <a-form layout="vertical">
            <a-row :gutter="{ xs: 8, sm: 16, md: 24 }">
              <a-col :xs="24" :sm="8" :md="8">
                <a-form-item label="用戶名/信箱">
                  <a-input-search v-model:value="searchQuery" placeholder="請輸入關鍵字" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="8" :md="8">
                <a-form-item label="用戶狀態">
                  <a-select v-model:value="filterStatus" style="width: 100%">
                    <a-select-option value="all">全部</a-select-option>
                    <a-select-option value="normal">正常</a-select-option>
                    <a-select-option value="banned">已封禁</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="8" :md="8">
                <a-form-item label="註冊時間">
                  <a-range-picker v-model:value="dateRange" style="width: 100%" />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row>
              <a-col :span="24" style="text-align: center; margin-top: 8px;">
                <a-space size="middle">
                  <a-button type="primary" @click="handleSearch">
                    <template #icon>
                      <SearchOutlined />
                    </template>
                    搜尋
                  </a-button>
                  <a-button @click="resetSearch">
                    <template #icon>
                      <ReloadOutlined />
                    </template>
                    重置
                  </a-button>
                </a-space>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <!-- 表格工具欄 -->
        <a-card class="table-toolbar" :style="{ marginBottom: '16px', background: '#fafafa' }">
          <a-row :gutter="16" align="middle">
            <a-col :span="12">
              <a-space>
                <a-button type="primary" @click="exportUsers" :loading="exporting">
                  <DownloadOutlined /> 導出用戶資料
                </a-button>
                <a-button danger :disabled="!selectedRowKeys.length" @click="batchBanUsers" :loading="batchProcessing">
                  <StopOutlined /> 批量封禁
                </a-button>
              </a-space>
            </a-col>
            <a-col :span="12" style="text-align: right">
              <a-tag>已選擇 {{ selectedRowKeys.length }} 項</a-tag>
            </a-col>
          </a-row>
        </a-card>

        <!-- 用戶列表 -->
        <a-table 
          :columns="columns" 
          :data-source="authStore.userManagement.users" 
          :loading="authStore.userManagement.loading" 
          :pagination="pagination"
          :row-selection="{ selectedRowKeys, onChange: onSelectChange }" 
          @change="handleTableChange"
          :style="{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }"
          row-key="uid"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'banned' ? 'red' : 'green'">
                {{ record.status === 'banned' ? '已封禁' : '正常' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="primary" size="small" @click="openUserDrawer(record)">
                  詳情
                </a-button>
                <a-button 
                  :danger="record.status === 'normal'"
                  size="small" 
                  :loading="actionLoading === record.uid"
                  @click="toggleUserStatus(record)"
                >
                  {{ record.status === 'banned' ? '解封' : '封禁' }}
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>

        <!-- 用戶詳情抽屜 -->
        <a-drawer 
          title="用戶管理" 
          :open="drawerVisible" 
          @close="closeDrawer" 
          width="720" 
          :style="{ padding: '16px' }"
        >
          <template v-if="authStore.userManagement.selectedUser">
            <a-descriptions bordered>
              <a-descriptions-item label="用戶名" :span="3">
                {{ authStore.userManagement.selectedUser.una }}
              </a-descriptions-item>
              <a-descriptions-item label="信箱" :span="3">
                {{ authStore.userManagement.selectedUser.email }}
              </a-descriptions-item>
              <a-descriptions-item label="角色" :span="3">
                {{ authStore.userManagement.selectedUser.role === 'admin' ? '管理員' : '一般用戶' }}
              </a-descriptions-item>
              <a-descriptions-item label="狀態" :span="3">
                <a-tag :color="authStore.userManagement.selectedUser?.status === 'banned' ? 'red' : 'green'">
                  {{ authStore.userManagement.selectedUser?.status === 'banned' ? '已封禁' : '正常' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="註冊時間" :span="3">
                {{ formatDate(authStore.userManagement.selectedUser.reg_date) }}
              </a-descriptions-item>
            </a-descriptions>
            <div class="drawer-footer">
              <a-space>
                <a-button danger @click="resetUserPassword">重置密碼</a-button>
                <a-button type="primary" @click="editUserInfo">編輯資料</a-button>
              </a-space>
            </div>
          </template>
        </a-drawer>

        <!-- 編輯用戶資料對話框 -->
        <a-modal 
          v-model:open="editModalVisible" 
          title="編輯用戶資料" 
          @ok="handleEditSubmit" 
          :style="{ padding: '16px' }"
        >
          <a-form :model="editForm" :rules="editRules">
            <a-form-item label="用戶名" name="username">
              <a-input v-model:value="editForm.username" />
            </a-form-item>
            <a-form-item label="信箱" name="email">
              <a-input v-model:value="editForm.email" />
            </a-form-item>
            <a-form-item label="角色" name="role">
              <a-select v-model:value="editForm.role">
                <a-select-option value="user">一般用戶</a-select-option>
                <a-select-option value="admin">管理員</a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </a-modal>
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        識真網 ©2024 Created by Ant UED
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { TablePaginationConfig } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import Sidebar from '../layout/sidebar.vue';
import Header from '../layout/header.vue';
import {
  TeamOutlined,
  UserAddOutlined,
  WarningOutlined,
  LineChartOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  StopOutlined,
} from '@ant-design/icons-vue';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// 側邊欄狀態
const collapsed = ref(false);
const broken = ref(false);

const layoutMargin = computed(() => {
  if (broken.value) {
    return collapsed.value ? '0px' : '200px';
  }
  return collapsed.value ? '0px' : '200px';
});

const onCollapse = (isCollapsed: boolean, type: string) => {
  console.log(isCollapsed, type);
};

// 定義表格列
const columns = [
  {
    title: '用戶名',
    dataIndex: 'una',
    key: 'username',
    sorter: true
  },
  {
    title: '信箱',
    dataIndex: 'email',
    key: 'email'
  },
  {
    title: '註冊時間',
    dataIndex: 'reg_date',
    key: 'createdAt',
    sorter: true,
    render: (text: string) => text ? formatDate(text) : '-'
  },
  {
    title: '狀態',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '操作',
    key: 'action'
  }
];

// 狀態變數
const authStore = useAuthStore();
const searchQuery = ref('');
const filterStatus = ref('all');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const drawerVisible = ref(false);
const editModalVisible = ref(false);
const selectedRowKeys = ref<string[]>([]);
const actionLoading = ref<string | null>(null);
const exporting = ref(false);
const batchProcessing = ref(false);

// 編輯表單
const editForm = ref({
  username: '',
  email: '',
  role: ''
});

// 表單驗證規則
const editRules = {
  username: [{ required: true, message: '請輸入用戶名', trigger: 'blur' }],
  email: [
    { required: true, message: '請輸入信箱', trigger: 'blur' },
    { type: 'email', message: '請輸入有效的信箱地址', trigger: 'blur' }
  ],
  role: [{ required: true, message: '請選擇角色', trigger: 'change' }]
};

// 分頁配置
const pagination = ref<TablePaginationConfig>({
  total: 0,
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 筆`
});

// 統計數據
const statistics = ref({
  totalUsers: 0,
  monthlyNewUsers: 0,
  pendingReports: 0,
  todayActiveUsers: 0
});

// 監聽 authStore.userManagement 的變化，同步更新分頁信息
watch(() => authStore.userManagement.total, (newTotal) => {
  if (newTotal !== undefined) {
    pagination.value.total = newTotal;
  }
});

watch(() => authStore.userManagement.currentPage, (newPage) => {
  if (newPage !== undefined) {
    pagination.value.current = newPage;
  }
});

watch(() => authStore.userManagement.pageSize, (newSize) => {
  if (newSize !== undefined) {
    pagination.value.pageSize = newSize;
  }
});

// 載入用戶列表
const loadUsers = async () => {
  try {
    const params = {
      page: pagination.value.current || 1,
      pageSize: pagination.value.pageSize || 10,
      una: searchQuery.value || undefined,
      status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
      start_date: dateRange.value ? dateRange.value[0].format('YYYY-MM-DD') : undefined,
      end_date: dateRange.value ? dateRange.value[1].format('YYYY-MM-DD') : undefined
    };

    await authStore.fetchUsers(params);
  } catch (error) {
    message.error('加載用戶列表失敗');
  }
};

// 載入統計數據
const loadStatistics = async () => {
  try {
    const data = await authStore.fetchUserStatistics();
    statistics.value = data;
  } catch (error) {
    message.error('加載統計數據失敗');
  }
};

// 處理搜尋
const handleSearch = () => {
  pagination.value.current = 1;
  loadUsers();
};

// 重置搜尋
const resetSearch = () => {
  searchQuery.value = '';
  filterStatus.value = 'all';
  dateRange.value = undefined;
  handleSearch();
};

// 處理表格變化
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.value = pag;
  loadUsers();
};

// 選擇行變化
const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

// 打開用戶詳情抽屜
const openUserDrawer = async (user: any) => {
  try {
    await authStore.getUserDetails(user.uid);
    drawerVisible.value = true;
  } catch (error) {
    message.error('獲取用戶詳情失敗');
  }
};

// 關閉抽屜
const closeDrawer = () => {
  drawerVisible.value = false;
  authStore.userManagement.selectedUser = null;
};

// 切換用戶狀態
const toggleUserStatus = async (user: any) => {
  try {
    actionLoading.value = user.uid;
    const newStatus = user.status === 'banned' ? 'normal' : 'banned';
    await authStore.updateUserStatus(user.uid, newStatus);
    message.success(`用戶狀態已更新為${newStatus === 'banned' ? '已封禁' : '正常'}`);
  } catch (error) {
    message.error('操作失敗');
  } finally {
    actionLoading.value = null;
  }
};

// 批量封禁用戶
const batchBanUsers = async () => {
  if (!selectedRowKeys.value.length) {
    message.warning('請先選擇要封禁的用戶');
    return;
  }
  
  try {
    batchProcessing.value = true;
    await authStore.batchUpdateUserStatus(selectedRowKeys.value, 'banned');
    message.success('批量操作成功');
    selectedRowKeys.value = [];
  } catch (error) {
    message.error('批量操作失敗');
  } finally {
    batchProcessing.value = false;
  }
};

// 重置用戶密碼
const resetUserPassword = async () => {
  if (!authStore.userManagement.selectedUser) return;
  try {
    await authStore.resetUserPassword(authStore.userManagement.selectedUser.uid);
    message.success('密碼已重置為預設值');
  } catch (error) {
    message.error('密碼重置失敗');
  }
};

// 編輯用戶資料
const editUserInfo = () => {
  if (!authStore.userManagement.selectedUser) return;
  editForm.value = {
    username: authStore.userManagement.selectedUser.una,
    email: authStore.userManagement.selectedUser.email,
    role: authStore.userManagement.selectedUser.role
  };
  editModalVisible.value = true;
};

// 提交編輯
const handleEditSubmit = async () => {
  if (!authStore.userManagement.selectedUser) return;
  try {
    await authStore.updateUserInfo(authStore.userManagement.selectedUser.uid, editForm.value);
    editModalVisible.value = false;
    loadUsers();
  } catch (error) {
    message.error('更新失敗');
  }
};

// 導出用戶資料
const exportUsers = async () => {
  try {
    exporting.value = true;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('用戶列表');

    worksheet.columns = [
      { header: '用戶名', key: 'username' },
      { header: '信箱', key: 'email' },
      { header: '註冊時間', key: 'createdAt' },
      { header: '狀態', key: 'status' }
    ];

    worksheet.addRows(authStore.userManagement.users.map(user => ({
      username: user.una,
      email: user.email,
      createdAt: formatDate(user.reg_date),
      status: user.status === 'banned' ? '已封禁' : '正常'
    })));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `用戶列表_${dayjs().format('YYYY-MM-DD')}.xlsx`;
    link.click();
    message.success('用戶資料已導出');
  } catch (error) {
    message.error('導出失敗，請稍後再試');
  } finally {
    exporting.value = false;
  }
};

// 格式化日期
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
};

// 初始化
onMounted(() => {
  loadUsers();
  loadStatistics();
});
</script>

<style scoped>
.search-area {
  margin: 16px;
  padding: 16px;
  border-radius: 8px;
}

a-form-item {
  margin-bottom: 16px;
}

.user-activity {
  margin-top: 24px;
}

.overview-cards {
  margin: 16px;
}

.table-toolbar {
  margin: 16px;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-card {
  margin-bottom: 16px;
}

.user-card-cover {
  height: 120px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-card-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
}

.security-log-detail {
  color: rgba(0, 0, 0, 0.45);
  margin-left: 24px;
  margin-top: 4px;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  border-top: 1px solid #e8e8e8;
  padding: 10px 16px;
  text-align: right;
  left: 0;
  background: #fff;
}

a-table {
  margin: 16px;
  border-radius: 8px;
  overflow: hidden;
}

a-card {
  border-radius: 8px;
}

a-button {
  border-radius: 4px;
}

/* 響應式調整 */
@media (max-width: 576px) {
  .search-area {
    margin: 8px;
    padding: 12px;
  }

  :deep(.ant-form-item) {
    margin-bottom: 12px;
  }

  :deep(.ant-space) {
    display: flex;
    gap: 8px;
  }

  :deep(.ant-btn) {
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .search-area :deep(.ant-form-item-label) {
    padding-bottom: 4px;
  }

  .search-area :deep(.ant-col) {
    padding-bottom: 8px;
  }
}
</style>