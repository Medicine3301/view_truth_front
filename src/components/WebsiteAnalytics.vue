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
                <a-statistic 
                  title="今日訪問量" 
                  :value="analytics.dailyVisits" 
                  :value-style="{ color: '#3f8600' }"
                >
                  <template #prefix>
                    <EyeOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic 
                  title="活躍用戶" 
                  :value="analytics.activeUsers" 
                  :value-style="{ color: '#0050b3' }"
                >
                  <template #prefix>
                    <UserOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic 
                  title="平均停留時間" 
                  :value="analytics.avgDuration" 
                  :value-style="{ color: '#1890ff' }"
                  suffix="分鐘"
                >
                  <template #prefix>
                    <ClockCircleOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic 
                  title="跳出率" 
                  :value="analytics.bounceRate" 
                  :value-style="{ color: analytics.bounceRate > 50 ? '#cf1322' : '#3f8600' }"
                  suffix="%"
                >
                  <template #prefix>
                    <RiseOutlined :style="{ color: analytics.bounceRate > 50 ? '#cf1322' : '#3f8600' }" />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
          </a-row>
        </div>

        <!-- 時間範圍選擇 -->
        <a-card class="filter-card">
          <a-space>
            <a-range-picker 
              v-model:value="dateRange" 
              :disabled-date="disabledDate"
              @change="handleDateChange"
            />
            <a-select 
              v-model:value="timeGranularity" 
              style="width: 120px"
              @change="handleGranularityChange"
            >
              <a-select-option value="hour">每小時</a-select-option>
              <a-select-option value="day">每天</a-select-option>
              <a-select-option value="week">每週</a-select-option>
              <a-select-option value="month">每月</a-select-option>
            </a-select>
          </a-space>
        </a-card>

        <!-- 訪問量趨勢圖 -->
        <a-row :gutter="16" class="chart-row">
          <a-col :span="24">
            <a-card title="訪問量趨勢">
              <div ref="visitChart" style="height: 400px"></div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 用戶行為分析 -->
        <a-row :gutter="16" class="chart-row">
          <a-col :span="12">
            <a-card title="熱門頁面">
              <a-table 
                :columns="pageColumns" 
                :data-source="analytics.popularPages"
                :pagination="{ pageSize: 5 }"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'pageViews'">
                    <a-progress 
                      :percent="(record.pageViews / analytics.maxPageViews) * 100" 
                      :show-info="false"
                    />
                    {{ record.pageViews }}
                  </template>
                </template>
              </a-table>
            </a-card>
          </a-col>
          <a-col :span="12">
            <a-card title="用戶來源">
              <div ref="sourceChart" style="height: 300px"></div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 用戶行為路徑 -->
        <a-card title="用戶行為路徑" class="behavior-card">
          <div ref="behaviorChart" style="height: 400px"></div>
        </a-card>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';

import Sidebar from '../layout/sidebar.vue';
import Header from '../layout/header.vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import {
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  RiseOutlined
} from '@ant-design/icons-vue';
import type { Dayjs } from 'dayjs';
import { useAnalyticsStore } from '../stores/analytics';
interface VisitData {
  date: string;
  visits: number;
}

interface PopularPage {
  path: string;
  pageViews: number;
  avgDuration: number;
}

interface SourceData {
  name: string;
  value: number;
}

interface BehaviorNode {
  name: string;
}

interface BehaviorLink {
  source: string;
  target: string;
  value: number;
}

interface Analytics {
  dailyVisits: number;
  activeUsers: number;
  avgDuration: number;
  bounceRate: number;
  popularPages: PopularPage[];
  maxPageViews: number;
  visitData: VisitData[];
  sourceData: SourceData[];
  behaviorData: {
    nodes: BehaviorNode[];
    links: BehaviorLink[];
  };
}

// 側邊欄狀態
const collapsed = ref(false);
const layoutMargin = computed(() => collapsed.value ? '80px' : '200px');
const onCollapse = (isCollapsed: boolean) => {
  collapsed.value = isCollapsed;
};

// 分析數據存儲
const analyticsStore = useAnalyticsStore();
const analytics = ref<Analytics>({
  dailyVisits: 0,
  activeUsers: 0,
  avgDuration: 0,
  bounceRate: 0,
  popularPages: [],
  maxPageViews: 0,
  visitData: [],
  sourceData: [],
  behaviorData: {
    nodes: [],
    links: []
  }
});

// 時間範圍選擇
const dateRange = ref<[Dayjs, Dayjs]>([dayjs().subtract(7, 'day'), dayjs()]);
const timeGranularity = ref('day');

// 頁面表格列定義
const pageColumns = [
  {
    title: '頁面路徑',
    dataIndex: 'path',
    key: 'path',
  },
  {
    title: '瀏覽次數',
    dataIndex: 'pageViews',
    key: 'pageViews',
    sorter: (a: any, b: any) => a.pageViews - b.pageViews,
  },
  {
    title: '平均停留時間',
    dataIndex: 'avgDuration',
    key: 'avgDuration',
  }
];

// 圖表實例
const visitChart = ref<HTMLElement | null>(null);
const sourceChart = ref<HTMLElement | null>(null);
const behaviorChart = ref<HTMLElement | null>(null);
let visitChartInstance: echarts.ECharts | null = null;
let sourceChartInstance: echarts.ECharts | null = null;
let behaviorChartInstance: echarts.ECharts | null = null;

// 日期限制
const disabledDate = (current: Dayjs) => {
  return current && current > dayjs().endOf('day');
};

// 處理日期變更
const handleDateChange = async () => {
  await loadAnalyticsData();
};

// 處理時間粒度變更
const handleGranularityChange = async () => {
  await loadAnalyticsData();
};

// 載入分析數據
const loadAnalyticsData = async () => {
  try {
    const [startDate, endDate] = dateRange.value;
    const params = {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      granularity: timeGranularity.value
    };

    const data = await analyticsStore.fetchAnalyticsData(params);
    analytics.value = data;
    
    // 更新圖表
    updateVisitChart();
    updateSourceChart();
    updateBehaviorChart();
  } catch (error) {
    console.error('載入分析數據失敗:', error);
    // 顯示更友善的錯誤提示
    const errorMessage = error.toString().includes('Sankey is a DAG') 
      ? '無法顯示用戶行為路徑圖表：資料中包含循環依賴關係。系統已自動處理循環依賴，但圖表可能不完整。'
      : '載入分析數據失敗，請稍後重試。';
    
    // 使用 ant-design-vue 的通知元件顯示錯誤
    import('ant-design-vue').then(({ notification }) => {
      notification.error({
        message: '載入錯誤',
        description: errorMessage
      });
    });
  }
};

// 初始化訪問量趨勢圖
const initVisitChart = () => {
  if (visitChart.value) {
    visitChartInstance = echarts.init(visitChart.value);
  }
};

// 更新訪問量趨勢圖
const updateVisitChart = () => {
  if (!visitChartInstance) return;

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: analytics.value.visitData.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '訪問量',
        type: 'line',
        smooth: true,
        data: analytics.value.visitData.map(item => item.visits),
        areaStyle: {
          opacity: 0.1
        }
      }
    ]
  };

  visitChartInstance.setOption(option);
};

// 初始化來源分布圖
const initSourceChart = () => {
  if (sourceChart.value) {
    sourceChartInstance = echarts.init(sourceChart.value);
  }
};

// 更新來源分布圖
const updateSourceChart = () => {
  if (!sourceChartInstance) return;

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '訪問來源',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: analytics.value.sourceData
      }
    ]
  };

  sourceChartInstance.setOption(option);
};

// 初始化行為路徑圖
const initBehaviorChart = () => {
  if (behaviorChart.value) {
    behaviorChartInstance = echarts.init(behaviorChart.value);
  }
};

// 更新行為路徑圖
const updateBehaviorChart = () => {
  if (!behaviorChartInstance) return;

  // 檢查數據是否存在循環依賴
  const links = analytics.value.behaviorData.links;
  
  // 創建一個映射來跟踪每個節點及其目標
  const nodeTargets = new Map();
  
  // 查找並移除循環依賴
  const processedLinks = [...links].map(link => {
    // 創建新的連線對象，避免修改原始數據
    return { ...link };
  }).filter(link => {
    // 檢查此連線是否會形成循環
    if (wouldCreateCycle(link.source, link.target, nodeTargets)) {
      console.warn(`檢測到循環依賴: ${link.source} -> ${link.target}`);
      return false; // 過濾掉導致循環的連線
    }
    
    // 記錄此節點及其目標
    if (!nodeTargets.has(link.source)) {
      nodeTargets.set(link.source, new Set());
    }
    nodeTargets.get(link.source).add(link.target);
    
    return true;
  });

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency'
        },
        data: analytics.value.behaviorData.nodes,
        links: processedLinks // 使用處理過的連線
      }
    ]
  };

  behaviorChartInstance.setOption(option);
};

// 檢查添加新連線是否會形成循環
const wouldCreateCycle = (source, target, nodeTargets, visited = new Set()) => {
  // 如果目標節點已經在訪問路徑中，說明形成了循環
  if (visited.has(target)) {
    return true;
  }
  
  // 如果源節點還沒有任何目標，則不會形成循環
  if (!nodeTargets.has(target)) {
    return false;
  }
  
  // 記錄已訪問的節點
  visited.add(source);
  
  // 檢查目標節點的所有目標
  for (const nextTarget of nodeTargets.get(target)) {
    if (wouldCreateCycle(target, nextTarget, nodeTargets, visited)) {
      return true;
    }
  }
  
  // 回溯時移除當前節點
  visited.delete(source);
  
  return false;
};

// 監聽視窗大小變化
const handleResize = () => {
  visitChartInstance?.resize();
  sourceChartInstance?.resize();
  behaviorChartInstance?.resize();
};

// 生命週期鉤子
onMounted(async () => {
  // 初始化圖表
  initVisitChart();
  initSourceChart();
  initBehaviorChart();
  
  // 載入數據
  await loadAnalyticsData();
  
  // 監聽視窗大小變化
  window.addEventListener('resize', handleResize);
});

// 清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  visitChartInstance?.dispose();
  sourceChartInstance?.dispose();
  behaviorChartInstance?.dispose();
});
</script>

<style scoped>
.overview-cards {
  margin: 16px;
}

.filter-card {
  margin: 16px;
  padding: 16px;
  background: #fff;
}

.chart-row {
  margin: 16px;
}

.behavior-card {
  margin: 16px;
}

:deep(.ant-card) {
  border-radius: 8px;
}

:deep(.ant-statistic-content) {
  font-size: 24px;
}

:deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .overview-cards :deep(.ant-col) {
    margin-bottom: 16px;
  }
  
  .chart-row :deep(.ant-col) {
    margin-bottom: 16px;
  }
}
</style> 