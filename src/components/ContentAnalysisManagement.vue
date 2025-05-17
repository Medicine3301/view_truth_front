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
                <a-statistic title="總內容數量" :value="statistics.totalCount" :value-style="{ color: '#3f8600' }">
                  <template #prefix>
                    <FileTextOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic title="待審核內容" :value="statistics.pendingCount" :value-style="{ color: '#cf1322' }">
                  <template #prefix>
                    <ExclamationCircleOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic title="已審核內容" :value="statistics.approvedCount" :value-style="{ color: '#0050b3' }">
                  <template #prefix>
                    <CheckCircleOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic title="平均可信度" :value="statistics.avgCredibility" :precision="2" suffix="分" :value-style="{ color: '#1890ff' }">
                  <template #prefix>
                    <TrophyOutlined />
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
                <a-form-item label="關鍵字">
                  <a-input-search v-model:value="filterForm.searchQuery" placeholder="搜索標題或內容" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="8" :md="8">
                <a-form-item label="發布日期">
                  <a-range-picker 
                    v-model:value="filterForm.dateRange" 
                    format="YYYY-MM-DD" 
                    style="width: 100%"
                    :placeholder="['開始日期', '結束日期']"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="8" :md="8">
                <a-form-item label="審核狀態">
                  <a-select v-model:value="filterForm.pending" placeholder="審核狀態" allow-clear>
                    <a-select-option value="0">待審核</a-select-option>
                    <a-select-option value="1">已審核</a-select-option>
                    <a-select-option value="">全部</a-select-option>
                  </a-select>
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
                  <a-button @click="resetFilter">
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
                <a-button type="primary" @click="exportContent" :loading="exporting">
                  <DownloadOutlined /> 導出分析資料
                </a-button>
                <a-button type="primary" :disabled="!hasSelected" @click="handleBatchApprove" :loading="batchProcessing">
                  <CheckCircleOutlined /> 批量審核通過
                </a-button>
                <a-button :disabled="!hasSelected" @click="handleBatchReject" :loading="batchProcessing">
                  <ExclamationCircleOutlined /> 批量標記待審核
                </a-button>
              </a-space>
            </a-col>
            <a-col :span="12" style="text-align: right">
              <a-tag>已選擇 {{ selectedRowKeys.length }} 項</a-tag>
            </a-col>
          </a-row>
        </a-card>

        <!-- 內容分析列表 -->
        <a-table 
          :columns="columns" 
          :data-source="contentList" 
          :loading="loading" 
          :pagination="pagination"
          :row-selection="{ selectedRowKeys, onChange: onSelectChange }" 
          @change="handleTableChange"
          :style="{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }"
          row-key="nid"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <a-tooltip :title="record.title">
                <span>{{ record.title.length > 30 ? record.title.substring(0, 30) + '...' : record.title }}</span>
              </a-tooltip>
            </template>
            
            <template v-if="column.key === 'credibility'">
              <a-tooltip :title="record.credibility_level">
                <a-progress
                  :percent="record.credibility_score" 
                  :status="getCredibilityStatus(record.credibility_score)"
                  size="small"
                />
              </a-tooltip>
            </template>
            
            <template v-if="column.key === 'status'">
              <a-tag :color="record.Pending === '1' ? 'green' : 'orange'">
                {{ record.Pending === '1' ? '已審核' : '待審核' }}
              </a-tag>
            </template>
            
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="primary" size="small" @click="handleViewDetails(record)">
                  <template #icon><EyeOutlined /></template>
                  查看
                </a-button>
                
                <a-button 
                  v-if="record.Pending === '0'" 
                  type="success" 
                  size="small" 
                  :loading="actionLoading === record.nid"
                  @click="handleApprove(record)"
                >
                  <template #icon><CheckOutlined /></template>
                  審核通過
                </a-button>
                
                <a-button 
                  v-if="record.Pending === '1'" 
                  type="warning" 
                  size="small" 
                  :loading="actionLoading === record.nid"
                  @click="handleReject(record)"
                >
                  <template #icon><StopOutlined /></template>
                  標記待審核
                </a-button>
                
                <a-button 
                  danger 
                  size="small" 
                  :loading="actionLoading === record.nid"
                  @click="handleDelete(record)"
                >
                  <template #icon><DeleteOutlined /></template>
                  刪除
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>

        <!-- 詳情抽屜 -->
        <a-drawer 
          title="內容分析詳情" 
          :open="detailsVisible" 
          @close="handleDetailsClose" 
          width="720" 
          placement="right"
          destroyOnClose
          :mask-closable="true"
          :body-style="{ padding: '24px', overflow: 'auto' }"
        >
          <a-spin :spinning="detailLoading">
            <template v-if="selectedContent">
              <!-- 標題和基本信息區域 -->
              <div class="detail-header">
                <h2>{{ selectedContent.title }}</h2>
                <div class="detail-meta">
                  <a-space>
                    <a-tag>{{ selectedContent.event_type }}</a-tag>
                    <span>{{ formatDate(selectedContent.publish_date) }}</span>
                    <a-tag :color="selectedContent.Pending === '1' ? 'green' : 'orange'">
                      {{ selectedContent.Pending === '1' ? '已審核' : '待審核' }}
                    </a-tag>
                  </a-space>
                </div>
              </div>

              <!-- 可信度評分圓形展示 -->
              <div class="credibility-score-container">
                <div 
                  class="credibility-score-circle" 
                  :class="selectedContent && selectedContent.credibility_score !== null && selectedContent.credibility_score !== undefined ? getCredibilityClass(selectedContent.credibility_score) : 'low-credibility'"
                >
                  <div class="score-value">
                    {{ selectedContent && selectedContent.credibility_score !== null && selectedContent.credibility_score !== undefined ? selectedContent.credibility_score.toFixed(1) : 'N/A' }}
                  </div>
                  <div class="score-label">可信度分數</div>
                </div>
                <div class="credibility-level-text">
                  <strong>{{ selectedContent ? selectedContent.credibility_level : 'N/A' }}</strong>
                  <a-button type="link" v-if="selectedContent && selectedContent.link" @click="openOriginalContent">
                    <template #icon><LinkOutlined /></template>
                    查看原始內容
                  </a-button>
                </div>
              </div>

              <!-- 四個分析分數卡片 -->
              <a-row :gutter="[16, 16]" class="analysis-score-cards">
                <a-col :span="6">
                  <a-card class="analysis-score-card factual-card">
                    <template #title>
                      <a-space>
                        <FileSearchOutlined />
                        <span>真實性分數</span>
                      </a-space>
                    </template>
                    <div class="score-number">{{ selectedContent && selectedContent.factual_score !== null && selectedContent.factual_score !== undefined ? selectedContent.factual_score.toFixed(1) : 'N/A' }}</div>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card class="analysis-score-card critical-card">
                    <template #title>
                      <a-space>
                        <AuditOutlined />
                        <span>批判性分數</span>
                      </a-space>
                    </template>
                    <div class="score-number">{{ selectedContent && selectedContent.critical_score !== null && selectedContent.critical_score !== undefined ? selectedContent.critical_score.toFixed(1) : 'N/A' }}</div>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card class="analysis-score-card balanced-card">
                    <template #title>
                      <a-space>
                        <PartitionOutlined />
                        <span>平衡性分數</span>
                      </a-space>
                    </template>
                    <div class="score-number">{{ selectedContent && selectedContent.balanced_score !== null && selectedContent.balanced_score !== undefined ? selectedContent.balanced_score.toFixed(1) : 'N/A' }}</div>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card class="analysis-score-card source-card">
                    <template #title>
                      <a-space>
                        <SafetyCertificateOutlined />
                        <span>來源可靠性</span>
                      </a-space>
                    </template>
                    <div class="score-number">{{ selectedContent && selectedContent.source_score !== null && selectedContent.source_score !== undefined ? selectedContent.source_score.toFixed(1) : 'N/A' }}</div>
                  </a-card>
                </a-col>
              </a-row>

              <!-- 內容預覽 -->
              <a-card class="content-preview-card" title="內容預覽">
                <template #extra>
                  <a-tag>{{ selectedContent && selectedContent.location ? selectedContent.location : '未知地點' }}</a-tag>
                </template>
                <div class="content-preview">
                  <div v-if="selectedContent && selectedContent.img" class="content-image">
                    <img :src="selectedContent.img" alt="內容圖片" />
                  </div>
                  <div class="content-text">{{ selectedContent ? selectedContent.content : '無內容' }}</div>
                </div>
              </a-card>

              <!-- 分析詳情折疊面板 -->
              <a-collapse accordion class="analysis-collapse">
                <a-collapse-panel key="1" header="真實性分析">
                  <template #extra><FileSearchOutlined style="color: #1890ff" /></template>
                  <div class="analysis-detail">
                    <div class="analysis-content">
                      <pre>{{ formatAnalysisData(selectedContent.factual_analysis) }}</pre>
                    </div>
                  </div>
                </a-collapse-panel>
                <a-collapse-panel key="2" header="批判性分析">
                  <template #extra><AuditOutlined style="color: #52c41a" /></template>
                  <div class="analysis-detail">
                    <div class="analysis-content">
                      <pre>{{ formatAnalysisData(selectedContent.critical_analysis) }}</pre>
                    </div>
                  </div>
                </a-collapse-panel>
                <a-collapse-panel key="3" header="平衡性分析">
                  <template #extra><PartitionOutlined style="color: #fa8c16" /></template>
                  <div class="analysis-detail">
                    <div class="analysis-content">
                      <pre>{{ formatAnalysisData(selectedContent.balanced_analysis) }}</pre>
                    </div>
                  </div>
                </a-collapse-panel>
                <a-collapse-panel key="4" header="來源分析">
                  <template #extra><SafetyCertificateOutlined style="color: #722ed1" /></template>
                  <div class="analysis-detail">
                    <div class="analysis-content">
                      <pre>{{ formatAnalysisData(selectedContent.source_analysis) }}</pre>
                    </div>
                  </div>
                </a-collapse-panel>
                <a-collapse-panel key="5" header="驗證指南">
                  <template #extra><SolutionOutlined style="color: #13c2c2" /></template>
                  <div class="analysis-detail">
                    <div class="analysis-content">
                      <pre>{{ formatAnalysisData(selectedContent.verification_guide) }}</pre>
                    </div>
                  </div>
                </a-collapse-panel>
              </a-collapse>
            </template>
            <a-skeleton v-else-if="detailLoading" active />
          </a-spin>
          
          <div class="drawer-footer">
            <a-space>
              <a-button @click="handleDetailsClose">關閉</a-button>
              <template v-if="selectedContent">
                <a-button 
                  v-if="selectedContent.Pending === '0'" 
                  type="primary" 
                  @click="handleApprove(selectedContent)"
                >
                  <template #icon><CheckOutlined /></template>
                  審核通過
                </a-button>
                <a-button 
                  v-if="selectedContent.Pending === '1'" 
                  @click="handleReject(selectedContent)"
                >
                  <template #icon><StopOutlined /></template>
                  標記為待審核
                </a-button>
              </template>
            </a-space>
          </div>
        </a-drawer>

        <a-modal
          v-model:open="deleteModalVisible"
          title="確認刪除"
          ok-text="確認"
          cancel-text="取消"
          @ok="confirmDelete"
        >
          <p>確定要刪除這個內容嗎？此操作無法恢復。</p>
        </a-modal>
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        識真網 ©2024 Created by Ant UED
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useContentAnalysisStore, type ContentAnalysisItem } from '../stores/contentAnalysis';
import type { TablePaginationConfig } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import Sidebar from '../layout/sidebar.vue';
import Header from '../layout/header.vue';
import axios from 'axios';
import {
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  LinkOutlined,
  PartitionOutlined,
} from '@ant-design/icons-vue';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// 定義統計數據介面，與後端返回的欄位名一致
interface StatisticsData {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  avgCredibility: number;
}

// 側邊欄狀態
const collapsed = ref(false);
const layoutMargin = computed(() => collapsed.value ? '80px' : '200px');

const onCollapse = (isCollapsed: boolean, type: string) => {
  collapsed.value = isCollapsed;
};

// Store 實例
const contentAnalysisStore = useContentAnalysisStore();

// 狀態
const loading = ref(false);
const detailLoading = ref(false);
const detailsVisible = ref(false);
const deleteModalVisible = ref(false);
const contentToDelete = ref<number | null>(null);
const contentList = ref<ContentAnalysisItem[]>([]);
const selectedContent = ref<ContentAnalysisItem | null>(null);
const currentRecordNid = ref<number | null>(null);
const statistics = ref<StatisticsData>({
  totalCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  avgCredibility: 0
});
const selectedRowKeys = ref<number[]>([]);
const actionLoading = ref<number | null>(null);
const exporting = ref(false);
const batchProcessing = ref(false);

// 篩選表單
const filterForm = reactive({
  searchQuery: '',
  dateRange: [],
  pending: undefined,
  sortField: 'created_at',
  sortOrder: 'descend'
});

// 分頁配置
const pagination = ref<TablePaginationConfig>({
  total: 0,
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 筆`
});

// 表格列定義
const columns = [
  {
    title: '標題',
    dataIndex: 'title',
    key: 'title',
    width: '25%',
    sorter: true,
  },
  {
    title: '發布日期',
    dataIndex: 'publish_date',
    key: 'publish_date',
    width: '15%',
    sorter: true,
    render: (text: string) => text ? formatDate(text) : '-'
  },
  {
    title: '可信度評分',
    key: 'credibility',
    width: '20%',
    sorter: true,
  },
  {
    title: '審核狀態',
    key: 'status',
    width: '10%',
    filters: [
      { text: '待審核', value: '0' },
      { text: '已審核', value: '1' }
    ],
  },
  {
    title: '操作',
    key: 'action',
    width: '20%',
  },
];

// 計算屬性
const hasSelected = computed(() => selectedRowKeys.value.length > 0);

// 加載內容分析列表
const loadContentList = async () => {
  loading.value = true;
  
  try {
    const startDate = filterForm.dateRange && filterForm.dateRange.length > 0 && filterForm.dateRange[0]
      ? dayjs(filterForm.dateRange[0]).format('YYYY-MM-DD') 
      : undefined;
    const endDate = filterForm.dateRange && filterForm.dateRange.length > 0 && filterForm.dateRange[1]
      ? dayjs(filterForm.dateRange[1]).format('YYYY-MM-DD') 
      : undefined;
    
    const params = {
      page: pagination.value.current || 1,
      pageSize: pagination.value.pageSize || 10,
      searchQuery: filterForm.searchQuery || undefined,
      startDate,
      endDate,
      pending: filterForm.pending,
      sortField: filterForm.sortField,
      sortOrder: filterForm.sortOrder,
    };
    
    const result = await contentAnalysisStore.fetchContentAnalysisList(params);
    contentList.value = result.items;
    pagination.value.total = result.total;
  } catch (error) {
    console.error('加載內容列表失敗:', error);
    message.error('加載內容列表失敗');
  } finally {
    loading.value = false;
  }
};

// 加載統計數據
const loadStatistics = async () => {
  try {
    const statsDataFromStore = await contentAnalysisStore.fetchStatistics();
    console.log('從Store獲取的統計數據:', statsDataFromStore);
    
    if (statsDataFromStore) {
      // 直接使用Store返回的數據，欄位名需與後端一致
      statistics.value = {
        totalCount: Number(statsDataFromStore.totalCount || 0),
        pendingCount: Number(statsDataFromStore.pendingCount || 0),
        approvedCount: Number(statsDataFromStore.approvedCount || 0),
        avgCredibility: Number(statsDataFromStore.avgCredibility || 0)
      };
      console.log('處理後的統計數據 (statistics.value):', statistics.value);
    } else {
      console.warn('從Store獲取的統計數據為空或無效');
      message.error('統計數據加載失敗: Store返回數據無效');
    }
  } catch (error) {
    console.error('加載統計數據失敗:', error);
    message.error('統計數據加載失敗');
  }
};

// 處理表格排序變化
const handleTableChange = (pag: TablePaginationConfig, filters: any, sorter: any) => {
  pagination.value = pag;
  
  if (filters && filters.status && filters.status.length > 0) {
    filterForm.pending = filters.status[0];
  } else {
    filterForm.pending = undefined;
  }
  
  if (sorter && sorter.field) {
    filterForm.sortField = sorter.field;
    filterForm.sortOrder = sorter.order;
  }
  
  loadContentList();
};

// 處理搜尋
const handleSearch = () => {
  pagination.value.current = 1;
  loadContentList();
};

// 重置篩選
const resetFilter = () => {
  filterForm.searchQuery = '';
  filterForm.dateRange = [];
  filterForm.pending = undefined;
  filterForm.sortField = 'created_at';
  filterForm.sortOrder = 'descend';
  pagination.value.current = 1;
  loadContentList();
};

// 查看詳情
const handleViewDetails = async (record: ContentAnalysisItem) => {
  if (detailsVisible.value && currentRecordNid.value === record.nid) {
    return;
  }

  detailsVisible.value = true;
  detailLoading.value = true;
  selectedContent.value = null; 
  currentRecordNid.value = record.nid;

  console.log(`[Drawer] 開始加載 nid: ${record.nid} 的詳情`);

  try {
    selectedContent.value = { 
      ...record,
      factual_analysis: record.factual_analysis || { message: "正在加載詳細分析..." },
      critical_analysis: record.critical_analysis || { message: "正在加載詳細分析..." },
      balanced_analysis: record.balanced_analysis || { message: "正在加載詳細分析..." },
      source_analysis: record.source_analysis || { message: "正在加載詳細分析..." },
      verification_guide: record.verification_guide || { message: "正在加載驗證指南..." },
    };

    const apiResponse = await contentAnalysisStore.fetchContentDetail(record.nid);
    console.log(`[Drawer] API原始返回 (nid: ${record.nid}):`, JSON.parse(JSON.stringify(apiResponse)));

    if (currentRecordNid.value === record.nid) {
      let detailToDisplay: ContentAnalysisItem | null = null;

      // 檢查API返回的數據結構並解包
      if (apiResponse && typeof apiResponse === 'object') {
        if ('content' in apiResponse && typeof apiResponse.content === 'object' && apiResponse.content !== null) {
          console.log(`[Drawer] 解包 apiResponse.content`);
          detailToDisplay = apiResponse.content as ContentAnalysisItem;
        } else {
          console.log(`[Drawer] 直接使用 apiResponse`);
          detailToDisplay = apiResponse as ContentAnalysisItem;
        }
      }

      if (detailToDisplay) {
        selectedContent.value = detailToDisplay;
        console.log(`[Drawer] 成功加載並顯示 nid: ${record.nid} 的詳情 (selectedContent.value):`, JSON.parse(JSON.stringify(selectedContent.value)));
      } else {
        message.error('獲取詳情失敗: 數據格式不正確或無數據返回');
        console.warn(`[Drawer] nid: ${record.nid} 數據格式不正確或無數據返回`);
        handleDetailsClose();
      }
    } else {
      console.log(`[Drawer] nid: ${record.nid} 的請求已過期，當前顯示的是 nid: ${currentRecordNid.value}`);
    }
  } catch (error) {
    console.error(`[Drawer] 加載 nid: ${record.nid} 詳情失敗:`, error);
    message.error('獲取內容詳情失敗');
    if (currentRecordNid.value === record.nid) {
      handleDetailsClose();
    }
  } finally {
    if (currentRecordNid.value === record.nid) {
      detailLoading.value = false;
      console.log(`[Drawer] nid: ${record.nid} 加載動畫停止`);
    }
  }
};

// 關閉詳情抽屜
const handleDetailsClose = () => {
  detailsVisible.value = false;
  selectedContent.value = null;
  currentRecordNid.value = null;
  console.log('[Drawer] 抽屜已關閉，數據已清空');
};

// 審核通過
const handleApprove = async (record: ContentAnalysisItem) => {
  try {
    actionLoading.value = record.nid;
    await contentAnalysisStore.updateContentStatus({
      nid: record.nid,
      pending: '1'
    });
    message.success('內容已審核通過');
    loadContentList();
    
    if (selectedContent.value && selectedContent.value.nid === record.nid) {
      selectedContent.value.Pending = '1';
    }
  } catch (error) {
    console.error('審核失敗:', error);
    message.error('審核失敗');
  } finally {
    actionLoading.value = null;
  }
};

// 標記為待審核
const handleReject = async (record: ContentAnalysisItem) => {
  try {
    actionLoading.value = record.nid;
    await contentAnalysisStore.updateContentStatus({
      nid: record.nid,
      pending: '0'
    });
    message.success('內容已標記為待審核');
    loadContentList();
    
    if (selectedContent.value && selectedContent.value.nid === record.nid) {
      selectedContent.value.Pending = '0';
    }
  } catch (error) {
    console.error('操作失敗:', error);
    message.error('操作失敗');
  } finally {
    actionLoading.value = null;
  }
};

// 刪除
const handleDelete = (record: ContentAnalysisItem) => {
  contentToDelete.value = record.nid;
  deleteModalVisible.value = true;
};

// 確認刪除
const confirmDelete = async () => {
  if (contentToDelete.value === null) return;
  
  try {
    await contentAnalysisStore.deleteContent(contentToDelete.value);
    message.success('內容已刪除');
    loadContentList();
    
    if (selectedContent.value && selectedContent.value.nid === contentToDelete.value) {
      handleDetailsClose();
    }
  } catch (error) {
    console.error('刪除失敗:', error);
    message.error('刪除失敗');
  } finally {
    deleteModalVisible.value = false;
    contentToDelete.value = null;
  }
};

// 選擇行變化
const onSelectChange = (keys: number[]) => {
  selectedRowKeys.value = keys;
};

// 批量審核通過
const handleBatchApprove = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('請先選擇要審核的內容');
    return;
  }
  
  try {
    batchProcessing.value = true;
    await contentAnalysisStore.batchUpdateContentStatus({
      nids: selectedRowKeys.value,
      pending: '1'
    });
    message.success(`已批量審核通過 ${selectedRowKeys.value.length} 項內容`);
    loadContentList();
    selectedRowKeys.value = [];
  } catch (error) {
    console.error('批量審核失敗:', error);
    message.error('批量審核失敗');
  } finally {
    batchProcessing.value = false;
  }
};

// 批量標記為待審核
const handleBatchReject = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('請先選擇要標記的內容');
    return;
  }
  
  try {
    batchProcessing.value = true;
    await contentAnalysisStore.batchUpdateContentStatus({
      nids: selectedRowKeys.value,
      pending: '0'
    });
    message.success(`已批量標記 ${selectedRowKeys.value.length} 項內容為待審核`);
    loadContentList();
    selectedRowKeys.value = [];
  } catch (error) {
    console.error('批量操作失敗:', error);
    message.error('批量操作失敗');
  } finally {
    batchProcessing.value = false;
  }
};

// 導出內容資料
const exportContent = async () => {
  try {
    exporting.value = true;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('內容分析列表');

    worksheet.columns = [
      { header: '標題', key: 'title' },
      { header: '發布日期', key: 'publishDate' },
      { header: '可信度評分', key: 'credibility' },
      { header: '可信度級別', key: 'credibilityLevel' },
      { header: '審核狀態', key: 'status' }
    ];

    worksheet.addRows(contentList.value.map(item => ({
      title: item.title,
      publishDate: formatDate(item.publish_date),
      credibility: item.credibility_score?.toFixed(1) ?? '-',
      credibilityLevel: item.credibility_level,
      status: item.Pending === '1' ? '已審核' : '待審核'
    })));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `內容分析列表_${dayjs().format('YYYY-MM-DD')}.xlsx`;
    link.click();
    message.success('內容資料已導出');
  } catch (error) {
    console.error('導出失敗:', error);
    message.error('導出失敗，請稍後再試');
  } finally {
    exporting.value = false;
  }
};

// 獲取可信度狀態
const getCredibilityStatus = (score: number) => {
  if (score === null || score === undefined) return 'exception';
  if (score >= 80) return 'success';
  if (score >= 50) return 'normal';
  return 'exception';
};

// 格式化日期
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
};

// 格式化分析數據
const formatAnalysisData = (data: any) => {
  console.log('[formatAnalysisData] Input data:', data, 'Type:', typeof data);
  if (data === null || data === undefined) return '無分析數據';
  if (typeof data === 'string') {
    try {
      const parsedData = JSON.parse(data);
      if (typeof parsedData === 'object' && parsedData !== null) {
        console.log('[formatAnalysisData] Parsed string to object, formatting:', parsedData);
        return JSON.stringify(parsedData, null, 2);
      }
      console.log('[formatAnalysisData] String is not a JSON object string, returning as is:', data);
      return data; 
    } catch (e) {
      console.log('[formatAnalysisData] String parsing failed, returning as is:', data);
      return data;
    }
  }
  if (typeof data === 'object' && data !== null && data.message && Object.keys(data).length === 1) {
    console.log('[formatAnalysisData] Data is a message object:', data.message);
    return data.message;
  }
  if (typeof data === 'object' && data !== null) {
    try {
      console.log('[formatAnalysisData] Data is an object, formatting:', data);
      return JSON.stringify(data, null, 2);
    } catch (e) {
      console.error("[formatAnalysisData] JSON stringify 錯誤 (object):", e, data);
      return "數據格式錯誤，無法顯示";
    }
  }
  console.warn('[formatAnalysisData] Unexpected data type:', typeof data, data);
  return '未知數據格式';
};

// 打開原始內容
const openOriginalContent = () => {
  if (selectedContent.value && selectedContent.value.link) {
    window.open(selectedContent.value.link, '_blank');
  }
};

// 獲取可信度等級樣式
const getCredibilityClass = (score: number) => {
  if (score === null || score === undefined) return 'low-credibility';
  if (score >= 80) return 'high-credibility';
  if (score >= 50) return 'medium-credibility';
  return 'low-credibility';
};

// 初始化
onMounted(() => {
  loadStatistics();
  loadContentList();
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

.content-preview {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.content-image {
  margin-bottom: 16px;
  text-align: center;
}

.content-image img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
}

.content-text {
  white-space: pre-line;
  line-height: 1.6;
  margin-bottom: 16px;
}

.content-link {
  margin-top: 16px;
}

.analysis-content {
  margin-top: 16px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.analysis-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
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

/* 詳情頁面樣式 */
.detail-header {
  margin-bottom: 24px;
}

.detail-header h2 {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
}

.detail-meta {
  color: #666;
}

.credibility-score-container {
  display: flex;
  align-items: center;
  margin: 20px 0;
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.credibility-score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-right: 24px;
  color: #fff;
  font-weight: bold;
}

.high-credibility {
  background-color: #52c41a;
  box-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
}

.medium-credibility {
  background-color: #faad14;
  box-shadow: 0 0 10px rgba(250, 173, 20, 0.5);
}

.low-credibility {
  background-color: #f5222d;
  box-shadow: 0 0 10px rgba(245, 34, 45, 0.5);
}

.score-value {
  font-size: 24px;
}

.score-label {
  font-size: 12px;
  opacity: 0.8;
}

.credibility-level-text {
  display: flex;
  flex-direction: column;
}

.credibility-level-text strong {
  font-size: 18px;
  margin-bottom: 8px;
}

.analysis-score-cards {
  margin: 20px 0 24px;
}

.analysis-score-card {
  text-align: center;
  border-radius: 6px;
  transition: all 0.3s;
}

.analysis-score-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.factual-card :deep(.ant-card-head) {
  background-color: rgba(24, 144, 255, 0.1);
}

.critical-card :deep(.ant-card-head) {
  background-color: rgba(82, 196, 26, 0.1);
}

.balanced-card :deep(.ant-card-head) {
  background-color: rgba(250, 140, 22, 0.1);
}

.source-card :deep(.ant-card-head) {
  background-color: rgba(114, 46, 209, 0.1);
}

.score-number {
  font-size: 28px;
  font-weight: bold;
  padding: 10px 0;
}

.content-preview-card {
  margin-bottom: 24px;
}

.analysis-collapse {
  margin-bottom: 80px;
}

.analysis-detail {
  padding: 8px 0;
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
  
  .credibility-score-container {
    flex-direction: column;
    align-items: center;
  }
  
  .credibility-score-circle {
    margin-right: 0;
    margin-bottom: 16px;
  }
  
  .credibility-level-text {
    text-align: center;
  }
  
  .analysis-score-cards :deep(.ant-col) {
    margin-bottom: 16px;
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