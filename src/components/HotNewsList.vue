<template>
  <a-layout>
    <Sidebar v-model:collapsed="collapsed" :onCollapse="onCollapse" />
    <a-layout :style="{ marginLeft: layoutMargin }">
      <Header />
      <a-layout-content :style="{ margin: '24px 16px 0', minHeight: 'calc(100vh - 112px)' }" class="content-wrapper">
        <a-card class="news-main-content">
          <div class="page-header">
            <div class="title-wrapper">
              <h2>熱門內容排行</h2>
              <a-tooltip title="依照點擊次數排序，顯示熱門內容">
                <InfoCircleOutlined class="info-icon" />
              </a-tooltip>
            </div>
            
            <!-- 時間範圍篩選 -->
            <div class="date-filter-container">
              <div class="date-filter-header">
                <FilterOutlined />
                <span>依照分析時間篩選</span>
                <a-tooltip title="根據內容的分析時間篩選結果">
                  <QuestionCircleOutlined class="question-icon" />
                </a-tooltip>
              </div>
              <div class="time-range-filter">
                <a-range-picker
                  v-model:value="dateRange"
                  :format="dateFormat"
                  @change="handleDateRangeChange"
                  :placeholder="['開始日期', '結束日期']"
                  :style="{ width: '320px' }"
                  :allowClear="true"
                >
                  <template #suffixIcon>
                    <CalendarOutlined />
                  </template>
                </a-range-picker>
                <a-button 
                  type="primary" 
                  ghost 
                  :disabled="!dateRange" 
                  @click="dateRange = null; resetPagination();" 
                  class="clear-date-btn"
                >
                  <ReloadOutlined />
                  清除篩選
                </a-button>
              </div>
            </div>
            
            <!-- 標籤篩選 -->
            <div class="filter-section">
              <a-space direction="vertical" :size="[0, 8]" class="filter-space" :style="{ width: '100%' }">
                <a-row :gutter="[16, 16]">
                  <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                    <a-select
                      v-model:value="selectedEventType"
                      placeholder="選擇類型"
                      class="filter-item"
                      :style="{ width: '100%' }"
                      @change="filterNews"
                    >
                      <a-select-option value="">全部類型</a-select-option>
                      <a-select-option v-for="type in eventTypes" :key="type" :value="type">
                        {{ type }}
                      </a-select-option>
                    </a-select>
                  </a-col>
                  <a-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
                    <a-input-search
                      v-model:value="searchText"
                      placeholder="搜尋熱門分析"
                      class="filter-item"
                      :style="{ width: '100%' }"
                      @search="onSearch"
                      enter-button
                    />
                  </a-col>
                </a-row>
              </a-space>
            </div>
          </div>

          <!-- 熱門新聞列表 -->
          <a-spin :spinning="loading" tip="載入中...">
            <a-empty v-if="filteredNews.length === 0 && !loading" description="沒有找到相關新聞" />
            <template v-else>
              <!-- 前三名專區 -->
              <div class="top-three-section" v-if="displayedTopThree.length > 0">
                <div class="top-three-header">
                  <FireOutlined class="fire-icon" />
                  <span>熱門 TOP 3</span>
                </div>
                
                <a-row :gutter="[16, 16]">
                  <a-col v-for="(news, index) in displayedTopThree" 
                         :key="news.nid" 
                         :xs="24" 
                         :sm="24" 
                         :md="index === 0 ? 24 : 12" 
                         :lg="index === 0 ? 24 : 12">
                    <a-card 
                      hoverable 
                      class="news-card top-ranked" 
                      :class="`rank-${index+1}-card`"
                      @click="goToNewsDetail(news.nid)"
                    >
                      <template #title>
                        <div class="news-title-container">
                          <div class="rank-badge" :class="getRankClass(index)">
                            <span class="rank-number">{{ index + 1 }}</span>
                            <crown-outlined v-if="index === 0" class="crown-icon" />
                          </div>
                          <div class="news-title top-title">
                            {{ news.title }}
                            <span class="hot-tag" :class="`hot-tag-${index + 1}`">熱門</span>
                          </div>
                          <a-tag color="blue" class="news-type">{{ news.event_type || '一般新聞' }}</a-tag>
                        </div>
                      </template>
                      
                      <div class="news-meta">
                        <a-row :gutter="[16, 16]">
                          <a-col :xs="24" :sm="8" :md="8">
                            <div class="meta-item">
                              <EyeOutlined class="meta-icon" />
                              <span class="meta-value">{{ news.count || 0 }} 次瀏覽</span>
                            </div>
                          </a-col>
                          <a-col :xs="24" :sm="8" :md="8">
                            <div class="meta-item">
                              <CheckCircleOutlined class="meta-icon" />
                              <span class="meta-value">可信度: {{ news.credibility_level }}</span>
                            </div>
                          </a-col>
                          <a-col :xs="24" :sm="8" :md="8">
                            <div class="meta-item">
                              <ClockCircleOutlined class="meta-icon" />
                              <span class="meta-value">{{ formatDate(news.publish_date) }}</span>
                            </div>
                          </a-col>
                        </a-row>
                      </div>
                      
                      <div v-if="index === 0" class="news-image" v-show="news.img">
                        <img :src="news.img" :alt="news.title" />
                      </div>
                      
                      <div class="news-content">
                        <p class="news-summary">{{ formatContent(news.content) }}</p>
                      </div>
                      
                      <div class="news-scores">
                        <a-row :gutter="[16, 16]">
                          <a-col :xs="24" :sm="24" :md="6">
                            <a-statistic
                              title="可信度"
                              :value="news.credibility_score ? `${news.credibility_score.toFixed(1)}` : '尚未評分'"
                              :value-style="getScoreStyle(news.credibility_score)"
                              class="score-statistic"
                            >
                              <template #suffix>
                                <span v-if="news.credibility_score">/ 100</span>
                              </template>
                            </a-statistic>
                          </a-col>
                          <a-col :xs="8" :sm="8" :md="6">
                            <a-statistic
                              title="事實性"
                              :value="news.factual_score ? `${news.factual_score.toFixed(1)}` : '尚未評分'"
                              :value-style="getScoreStyle(news.factual_score)"
                              class="score-statistic"
                            >
                              <template #suffix>
                                <span v-if="news.factual_score">/ 100</span>
                              </template>
                            </a-statistic>
                          </a-col>
                          <a-col :xs="8" :sm="8" :md="6">
                            <a-statistic
                              title="批判性"
                              :value="news.critical_score ? `${news.critical_score.toFixed(1)}` : '尚未評分'"
                              :value-style="getScoreStyle(news.critical_score)"
                              class="score-statistic"
                            >
                              <template #suffix>
                                <span v-if="news.critical_score">/ 100</span>
                              </template>
                            </a-statistic>
                          </a-col>
                          <a-col :xs="8" :sm="8" :md="6">
                            <a-statistic
                              title="平衡性"
                              :value="news.balanced_score ? `${news.balanced_score.toFixed(1)}` : '尚未評分'"
                              :value-style="getScoreStyle(news.balanced_score)"
                              class="score-statistic"
                            >
                              <template #suffix>
                                <span v-if="news.balanced_score">/ 100</span>
                              </template>
                            </a-statistic>
                          </a-col>
                        </a-row>
                      </div>
                      
                      <div class="news-footer">
                        <a-space>
                          <a-tag><ClockCircleOutlined /> {{ formatDate(news.analysis_timestamp) }}</a-tag>
                          <a-button type="primary" size="small" class="read-more-btn" @click.stop="goToNewsDetail(news.nid)">
                            閱讀更多
                            <RightOutlined />
                          </a-button>
                        </a-space>
                      </div>
                    </a-card>
                  </a-col>
                </a-row>
              </div>
              
              <!-- 其他新聞列表 -->
              <div class="other-news-section" v-if="displayedOtherNews.length > 0">
                <div class="section-divider">
                  <div class="divider-line"></div>
                  <div class="divider-text">其他熱門內容</div>
                  <div class="divider-line"></div>
                </div>
                
                <a-list
                  :data-source="displayedOtherNews"
                  :row-key="(item) => item?.nid"
                  :grid="{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }"
                >
                  <template #renderItem="{ item: news, index }">
                    <a-list-item>
                      <a-card 
                        hoverable 
                        class="news-card"
                        @click="goToNewsDetail(news.nid)"
                      >
                        <template #title>
                          <div class="news-title-container">
                            <div class="rank-badge rank-normal">{{ index + 4 }}</div>
                            <div class="news-title">{{ news.title }}</div>
                            <a-tag color="blue" class="news-type">{{ news.event_type || '一般新聞' }}</a-tag>
                          </div>
                        </template>
                        
                        <div class="news-meta">
                          <a-row :gutter="[16, 16]">
                            <a-col :xs="24" :sm="12" :md="8">
                              <div class="meta-item">
                                <EyeOutlined class="meta-icon" />
                                <span class="meta-value">{{ news.count || 0 }} 次瀏覽</span>
                              </div>
                            </a-col>
                            <a-col :xs="24" :sm="12" :md="8">
                              <div class="meta-item">
                                <CheckCircleOutlined class="meta-icon" />
                                <span class="meta-value">可信度: {{ news.credibility_level }}</span>
                              </div>
                            </a-col>
                            <a-col :xs="24" :sm="12" :md="8">
                              <div class="meta-item">
                                <ClockCircleOutlined class="meta-icon" />
                                <span class="meta-value">{{ formatDate(news.publish_date) }}</span>
                              </div>
                            </a-col>
                          </a-row>
                        </div>
                        
                        <div class="news-content">
                          <p class="news-summary">{{ formatContent(news.content) }}</p>
                        </div>
                        
                        <div class="news-scores">
                          <a-row :gutter="[16, 16]">
                            <a-col :xs="24" :sm="24" :md="6">
                              <a-statistic
                                title="可信度"
                                :value="news.credibility_score ? `${news.credibility_score.toFixed(1)}` : '尚未評分'"
                                :value-style="getScoreStyle(news.credibility_score)"
                                class="score-statistic"
                              >
                                <template #suffix>
                                  <span v-if="news.credibility_score">/ 100</span>
                                </template>
                              </a-statistic>
                            </a-col>
                            <a-col :xs="8" :sm="8" :md="6">
                              <a-statistic
                                title="事實性"
                                :value="news.factual_score ? `${news.factual_score.toFixed(1)}` : '尚未評分'"
                                :value-style="getScoreStyle(news.factual_score)"
                                class="score-statistic"
                              >
                                <template #suffix>
                                  <span v-if="news.factual_score">/ 100</span>
                                </template>
                              </a-statistic>
                            </a-col>
                            <a-col :xs="8" :sm="8" :md="6">
                              <a-statistic
                                title="批判性"
                                :value="news.critical_score ? `${news.critical_score.toFixed(1)}` : '尚未評分'"
                                :value-style="getScoreStyle(news.critical_score)"
                                class="score-statistic"
                              >
                                <template #suffix>
                                  <span v-if="news.critical_score">/ 100</span>
                                </template>
                              </a-statistic>
                            </a-col>
                            <a-col :xs="8" :sm="8" :md="6">
                              <a-statistic
                                title="平衡性"
                                :value="news.balanced_score ? `${news.balanced_score.toFixed(1)}` : '尚未評分'"
                                :value-style="getScoreStyle(news.balanced_score)"
                                class="score-statistic"
                              >
                                <template #suffix>
                                  <span v-if="news.balanced_score">/ 100</span>
                                </template>
                              </a-statistic>
                            </a-col>
                          </a-row>
                        </div>
                        
                        <div class="news-footer">
                          <a-space>
                            <a-tag><ClockCircleOutlined /> {{ formatDate(news.analysis_timestamp) }}</a-tag>
                            <a-button type="primary" size="small" class="read-more-btn" @click.stop="goToNewsDetail(news.nid)">
                              閱讀更多
                              <RightOutlined />
                            </a-button>
                          </a-space>
                        </div>
                      </a-card>
                    </a-list-item>
                  </template>
                </a-list>
                
                <div class="loading-more" ref="loadingTrigger">
                  <a-spin v-if="loadingMore" tip="載入更多..." />
                  <a-empty v-if="!hasMore && displayedOtherNews.length > 0" description="沒有更多新聞" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
                </div>
              </div>
            </template>
          </a-spin>
        </a-card>
      </a-layout-content>
      <a-layout-footer class="custom-footer">
        識真網 ©2024 Created by View Truth Team
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import Sidebar from '../layout/sidebar.vue';
import Header from '../layout/header.vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { 
  RightOutlined, 
  InfoCircleOutlined, 
  ClockCircleOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  CrownOutlined, 
  FireOutlined, 
  CalendarOutlined,
  FilterOutlined,
  QuestionCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';
import { message, Empty } from 'ant-design-vue';
import { useIntersectionObserver } from '@vueuse/core';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const router = useRouter();
const authStore = useAuthStore();

// 側邊欄狀態
const collapsed = ref(false);
const broken = ref(false);

const layoutMargin = computed(() => {
  if (broken.value) {
    return collapsed.value ? '0px' : '200px';
  }
  return collapsed.value ? '0px' : '200px';
});

const onCollapse = (val: boolean, type: string) => {
  console.log(val, type);
  collapsed.value = val;
};

// 新聞資料和狀態
const loading = ref(true);
const searchText = ref('');
const selectedEventType = ref('');
const eventTypes = ref<string[]>([]);
const dateRange = ref<[Dayjs, Dayjs] | null>(null);
const dateFormat = 'YYYY-MM-DD';

// 分頁相關狀態
const pageSize = ref(5);
const currentPage = ref(1);
const loadingMore = ref(false);
const hasMore = ref(true);
const loadingTrigger = ref<HTMLElement | null>(null);
const displayedTopThree = ref<any[]>([]);
const displayedOtherNews = ref<any[]>([]);

// 從 store 獲取排序後的新聞
const sortedNews = computed(() => {
  if (!authStore.newstate.newsies) return [];
  
  // 複製陣列避免直接修改原始資料
  return [...authStore.newstate.newsies].sort((a, b) => {
    // 首先依據瀏覽次數（count）排序
    if ((a.count || 0) !== (b.count || 0)) {
      return (b.count || 0) - (a.count || 0);
    }
    // 如果瀏覽次數相同，則依據日期排序
    return new Date(b.publish_date || '').getTime() - new Date(a.publish_date || '').getTime();
  });
});

// 篩選後的新聞列表
const filteredNews = computed(() => {
  let filtered = sortedNews.value;
  
  // 日期範圍篩選
  if (dateRange.value) {
    const [startDate, endDate] = dateRange.value;
    
    // 將結束日期調整為當天的結束時間
    const endOfDay = endDate.hour(23).minute(59).second(59);
    
    filtered = filtered.filter(news => {
      // 只使用 analysis_timestamp 作為時間依據
      const itemDate = dayjs(news.analysis_timestamp || '');
      
      if (!itemDate.isValid()) {
        return false; // 無效日期，不包含
      }
      
      return itemDate.isAfter(startDate) && itemDate.isBefore(endOfDay);
    });
  }
  
  // 文字搜尋
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase();
    filtered = filtered.filter(news => 
      news.title?.toLowerCase().includes(searchLower) ||
      news.content?.toLowerCase().includes(searchLower) ||
      news.event_type?.toLowerCase().includes(searchLower)
    );
  }
  
  // 標籤篩選
  if (selectedEventType.value) {
    filtered = filtered.filter(news => news.event_type === selectedEventType.value);
  }
  
  return filtered;
});

// 監聽滾動
useIntersectionObserver(
  loadingTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !loadingMore.value && hasMore.value) {
      loadMoreNews();
    }
  }
);

// 加載更多新聞
const loadMoreNews = async () => {
  if (loadingMore.value) return;
  
  loadingMore.value = true;
  try {
    // 處理前三名
    if (currentPage.value === 1) {
      const topThree = filteredNews.value.slice(0, Math.min(3, filteredNews.value.length));
      displayedTopThree.value = topThree;
    }
    
    // 其他新聞的分頁加載
    const startIndex = Math.min(3, filteredNews.value.length) + ((currentPage.value - 1) * pageSize.value);
    const endIndex = startIndex + pageSize.value;
    const newItems = filteredNews.value.slice(startIndex, endIndex);
    
    if (newItems.length > 0) {
      displayedOtherNews.value = [...displayedOtherNews.value, ...newItems];
      currentPage.value++;
      hasMore.value = endIndex < filteredNews.value.length;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error('載入更多新聞失敗:', error);
  } finally {
    loadingMore.value = false;
  }
};

// 重置分頁
const resetPagination = () => {
  currentPage.value = 1;
  displayedTopThree.value = [];
  displayedOtherNews.value = [];
  hasMore.value = true;
  loadMoreNews();
};

// 修改過濾新聞類型函數
const filterNews = () => {
  console.log('過濾類型:', selectedEventType.value);
  resetPagination();
};

// 修改搜尋功能
const onSearch = (value: string) => {
  searchText.value = value;
  resetPagination();
};

// 處理日期範圍變更
const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
  dateRange.value = dates;
  resetPagination();
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '日期不詳';
  
  try {
    // 處理不同格式的日期字符串
    let dateObj: Date;
    
    if (dateString.includes('T')) {
      // 處理 ISO 格式
      dateObj = new Date(dateString);
    } else if (dateString.includes('-')) {
      // 處理 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss 格式
      dateObj = new Date(dateString.replace(' ', 'T'));
    } else {
      // 嘗試直接解析
      dateObj = new Date(dateString);
    }

    if (isNaN(dateObj.getTime())) {
      console.warn('無效的日期格式:', dateString);
      return '日期不詳';
    }
    
    // 格式化為中文日期時間格式
    return dateObj.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');
  } catch (error) {
    console.error('日期格式化錯誤:', error, '原始日期:', dateString);
    return '日期不詳';
  }
};

// 處理最大字數
const maxLength = 100; // 最大字數限制

const formatContent = (content: string) => {
  if (!content) return '';
  return content.length > maxLength ? content.slice(0, maxLength) + "..." : content;
};

// 獲取分數顏色樣式
const getScoreStyle = (score: number) => {
  if (!score) return { color: '#8c8c8c' };
  if (score >= 80) return { color: '#52c41a' }; // 80-100分 綠色
  if (score >= 60) return { color: '#faad14' }; // 60-79分 黃色
  return { color: '#ff4d4f' }; // 低於60分 紅色
};

// 排行榜樣式
const getRankClass = (index: number) => {
  if (index === 0) return 'rank-first';
  if (index === 1) return 'rank-second';
  if (index === 2) return 'rank-third';
  return 'rank-normal';
};

// 導航到新聞詳情頁面
const goToNewsDetail = async (nid: string) => {
  try {
    // 增加點擊數
    await fetch(`https://view-truth.zeabur.app/api/news/increment-count/${nid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    router.push({
      name: 'newspage',
      params: { id: nid }
    });
  } catch (error) {
    console.error('更新點擊數失敗:', error);
    // 即使更新失敗，仍然導航到新聞頁
    router.push({
      name: 'newspage',
      params: { id: nid }
    });
  }
};

// 初始化
onMounted(async () => {
  try {
    await authStore.getAllnewsies();
    
    // 收集所有事件類型以便篩選
    if (authStore.newstate.newsies) {
      const types = new Set<string>();
      authStore.newstate.newsies.forEach(news => {
        if (news.event_type) {
          types.add(news.event_type);
        }
      });
      eventTypes.value = Array.from(types);
    }
    
    // 初始載入第一頁
    resetPagination();
  } catch (error) {
    console.error('獲取新聞資料失敗:', error);
    message.error('載入新聞資料失敗');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.content-wrapper {
  padding: 0;
}

.news-main-content {
  max-width: 1200px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 24px;
  transition: all 0.3s ease;
}

.page-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 32px;
  padding: 0 8px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  background: linear-gradient(45deg, #ff4d4f, #ff7a45);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 1px rgba(0, 0, 0, 0.05);
}

.info-icon {
  color: #1890ff;
  font-size: 18px;
  margin-left: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.date-filter-container {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.date-filter-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: #333;
  font-weight: 600;
  font-size: 16px;
}

.date-filter-header .anticon {
  margin-right: 8px;
  color: #1890ff;
}

.question-icon {
  margin-left: 8px;
  color: #8c8c8c;
  cursor: pointer;
  transition: color 0.3s;
}

.question-icon:hover {
  color: #1890ff;
}

.time-range-filter {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.clear-date-btn {
  height: 40px;
  border-radius: 8px;
  transition: all 0.3s;
}

.clear-date-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.time-range-filter :deep(.ant-picker) {
  border-radius: 8px;
  height: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.time-range-filter :deep(.ant-picker:hover) {
  border-color: #40a9ff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.1);
}

.time-range-filter :deep(.ant-picker-focused) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.time-range-filter :deep(.ant-picker-input) {
  font-size: 14px;
}

.filter-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.news-card {
  width: 100%;
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.news-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #e6f7ff;
}

.news-title-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  position: relative;
}

.rank-badge {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-weight: bold;
  font-size: 18px;
  color: white;
  margin-right: 12px;
  position: relative;
}

.rank-first, .rank-second, .rank-third {
  width: 46px;
  height: 46px;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
}

.rank-first {
  background: linear-gradient(135deg, #ff4d4f, #f5222d);
  box-shadow: 0 4px 12px rgba(245, 34, 45, 0.5);
}

.rank-second {
  background: linear-gradient(135deg, #faad14, #d48806);
  box-shadow: 0 4px 12px rgba(212, 136, 6, 0.5);
}

.rank-third {
  background: linear-gradient(135deg, #52c41a, #389e0d);
  box-shadow: 0 4px 12px rgba(56, 158, 13, 0.5);
}

.rank-normal {
  background: #8c8c8c;
  box-shadow: none;
}

.crown-icon {
  position: absolute;
  top: -15px;
  font-size: 16px;
  color: #ffec3d;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
}

.hot-tag {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  font-weight: bold;
  color: white;
  vertical-align: middle;
}

.hot-tag-1 {
  background: linear-gradient(90deg, #ff4d4f, #ff7a45);
  animation: flame 2s infinite;
}

.hot-tag-2 {
  background: linear-gradient(90deg, #faad14, #fa8c16);
}

.hot-tag-3 {
  background: linear-gradient(90deg, #52c41a, #73d13d);
}

.top-title {
  font-weight: 700;
  font-size: 22px;
  color: #000;
}

.news-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  transition: color 0.3s ease;
  flex: 1;
  margin-right: 12px;
  word-break: break-word;
}

.news-meta {
  margin: 16px 0;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-icon {
  color: #1890ff;
  font-size: 16px;
}

.meta-value {
  color: #666;
  font-size: 14px;
}

.news-content {
  padding: 16px 0;
}

.news-summary {
  color: #4a4a4a;
  margin: 0;
  line-height: 1.8;
  font-size: 15px;
}

.news-scores {
  margin: 20px 0;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.score-statistic {
  position: relative;
  padding: 12px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.news-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.read-more-btn {
  border-radius: 20px;
  font-size: 13px;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

:deep(.ant-statistic-content) {
  font-size: 22px;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: baseline;
}

:deep(.ant-input-search .ant-input) {
  border-radius: 6px;
  height: 40px;
}

:deep(.ant-input-search .ant-input-search-button) {
  border-radius: 0 6px 6px 0;
  height: 40px;
}

.custom-footer {
  text-align: center;
  padding: 24px;
  color: #888;
}

.loading-more {
  text-align: center;
  margin: 24px 0;
  height: 60px;
  line-height: 60px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .news-main-content {
    padding: 16px;
  }
  
  .page-header h2 {
    font-size: 22px;
  }
  
  .rank-badge {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }
}

.top-ranked {
  border: none;
  position: relative;
  overflow: visible;
}

.top-ranked::before {
  content: '';
  position: absolute;
  top: -10px;
  right: -10px;
  bottom: -10px;
  left: -10px;
  z-index: -1;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.top-ranked.news-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes flame {
  0% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.2) drop-shadow(0 0 5px rgba(255, 77, 79, 0.6));
  }
  100% {
    filter: brightness(1);
  }
}

.top-three-section {
  margin-bottom: 40px;
  border-radius: 12px;
  padding: 20px;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%), 
                    url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjU3MjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6TTIwIDIwaDIwdjIwSDIwVjIwek0wIDIwaDIwdjIwSDBWMjB6Ii8+PC9nPjwvZz48L3N2Zz4=');
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.top-three-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255, 77, 79, 0.1);
}

.top-three-header span {
  font-size: 24px;
  font-weight: bold;
  color: #111;
  margin-left: 12px;
  background: linear-gradient(135deg, #ff4d4f, #ff7a45);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.fire-icon {
  font-size: 26px;
  color: #ff4d4f;
  animation: fire-pulse 2s infinite;
}

.rank-1-card {
  border: 2px solid #ffccc7; 
  background-color: rgba(255, 241, 240, 0.7);
}

.rank-2-card {
  border: 2px solid #ffe7ba;
  background-color: rgba(255, 251, 230, 0.7);
}

.rank-3-card {
  border: 2px solid #d9f7be;
  background-color: rgba(246, 255, 237, 0.7);
}

.news-image {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.news-image img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.news-image img:hover {
  transform: scale(1.02);
}

.section-divider {
  display: flex;
  align-items: center;
  margin: 32px 0 24px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #f0f0f0;
}

.divider-text {
  padding: 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: #666;
}

.other-news-section {
  background: #fff;
  border-radius: 12px;
  padding: 8px;
}

@keyframes fire-pulse {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 2px rgba(255, 77, 79, 0.5));
  }
  50% {
    transform: scale(1.2);
    filter: drop-shadow(0 0 8px rgba(255, 77, 79, 0.8));
  }
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 2px rgba(255, 77, 79, 0.5));
  }
}
</style>

