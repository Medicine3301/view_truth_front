<template>
    <a-layout>
        <Sidebar v-model:collapsed="collapsed" :onCollapse="onCollapse" />
        <a-layout :style="{ marginLeft: layoutMargin }">
            <Header />
            <a-layout-content :style="{ margin: '24px 16px 0', minHeight: 'calc(100vh - 112px)' }" class="content-wrapper">
                <a-card class="news-main-content">
                    <div class="page-header">
                        <div class="title-wrapper">
                            <h2>網路內容分析</h2>
                            <a-tooltip title="瀏覽最新評分及分析">
                                <InfoCircleOutlined class="info-icon" />
                            </a-tooltip>
                        </div>
                        <div class="filter-section">
                            <a-space direction="vertical" :size="[0, 8]" class="filter-space" :style="{ width: '100%' }">
                                <a-row :gutter="[16, 16]">
                                    <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                                        <a-range-picker
                                            v-model:value="dateRange"
                                            :format="dateFormat"
                                            @change="onDateRangeChange"
                                            class="filter-item"
                                            :style="{ width: '100%' }"
                                            :placeholder="['開始日期', '結束日期']"
                                        />
                                    </a-col>
                                    <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                                        <a-select
                                            v-model:value="selectedTags"
                                            mode="multiple"
                                            placeholder="選擇標籤"
                                            class="filter-item"
                                            :style="{ width: '100%' }"
                                            @change="onTagChange"
                                            :maxTagCount="3"
                                            :maxTagTextLength="5"
                                        >
                                            <a-select-option v-for="tag in availableTags" :key="tag" :value="tag">
                                                {{ tag }}
                                            </a-select-option>
                                        </a-select>
                                    </a-col>
                                    <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                                        <a-input-search
                                            v-model:value="searchText"
                                            placeholder="搜尋內容"
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

                    <a-spin :spinning="loading" tip="載入中...">
                        <a-empty v-if="displayedNews.length === 0 && !loading" description="沒有找到相關新聞" />
                        <a-list
                            v-else
                            :data-source="displayedNews"
                            :row-key="(item) => item?.nid"
                            :grid="{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }"
                        >
                            <template #renderItem="{ item: news }">
                                <a-list-item>
                                    <a-card 
                                        hoverable 
                                        class="news-card"
                                        @click="goToNewspage(news.nid)"
                                    >
                                        <template #title>
                                            <div class="news-title-container">
                                                <div class="news-title">{{ news.title }}</div>
                                                <a-tag color="blue" class="news-type">{{ news.event_type || '一般新聞' }}</a-tag>
                                            </div>
                                        </template>
                                        
                                        <div class="news-scores">
                                            <a-row :gutter="[16, 16]">
                                                <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
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
                                                <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="8">
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
                                                <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="8">
                                                    <a-statistic
                                                        title="客觀性"
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
                                        
                                        <div class="news-content">
                                            <p class="news-summary">{{ formatContent(news.content) }}</p>
                                        </div>
                                        
                                        <div class="news-footer">
                                            <a-space>
                                                <a-tag><ClockCircleOutlined /> {{ formatDate(news.analysis_timestamp) }}</a-tag>
                                                <a-button type="primary" size="small" class="read-more-btn" @click.stop="goToNewspage(news.nid)">
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
                            <a-empty v-if="!hasMore && displayedNews.length > 0" description="沒有更多新聞" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
                        </div>
                    </a-spin>
                </a-card>
            </a-layout-content>
            <a-layout-footer style="text-align: center">
                識真網 © 2024 Created by Ant UED
            </a-layout-footer>
        </a-layout>
    </a-layout>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { RightOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons-vue';
import { Empty } from 'ant-design-vue';
import Sidebar from '../layout/sidebar.vue';
import Header from '../layout/header.vue';
import { useAuthStore } from '../stores/auth';
import { message } from 'ant-design-vue';
import router from '../router';
import { useIntersectionObserver } from '@vueuse/core';
import dayjs from 'dayjs';

// 側邊欄狀態
const collapsed = ref(false);
const broken = ref(false);

const layoutMargin = computed(() => collapsed.value ? '0px' : '200px');

const onCollapse = (isCollapsed: boolean, type: string) => {
    collapsed.value = isCollapsed;
};
//引用狀態列
const newstore = useAuthStore();
const newsies = computed(() => newstore.newstate?.newsies || []);

// Add loading state
const loading = ref(true);

// 分頁相關狀態
const pageSize = ref(10);
const currentPage = ref(1);
const loadingMore = ref(false);
const hasMore = ref(true);
const loadingTrigger = ref<HTMLElement | null>(null);
const displayedNews = ref<any[]>([]);

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
        const startIndex = (currentPage.value - 1) * pageSize.value;
        const endIndex = startIndex + pageSize.value;
        const allFilteredNews = filteredNews.value;
        const newItems = allFilteredNews.slice(startIndex, endIndex);
        
        if (newItems.length > 0) {
            displayedNews.value = [...displayedNews.value, ...newItems];
            currentPage.value++;
            hasMore.value = endIndex < allFilteredNews.length;
        } else {
            hasMore.value = false;
        }
    } catch (error) {
        console.error('Error loading more news:', error);
    } finally {
        loadingMore.value = false;
    }
};

// 日期格式化函數
const formatDate = (date: string | null): string => {
  if (!date) return '日期不詳';
  
  try {
    // 處理不同格式的日期字符串
    let dateObj: Date;
    
    if (date.includes('T')) {
      // 處理 ISO 格式
      dateObj = new Date(date);
    } else if (date.includes('-')) {
      // 處理 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss 格式
      dateObj = new Date(date.replace(' ', 'T'));
    } else {
      // 嘗試直接解析
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      console.warn('無效的日期格式:', date);
      return '日期不詳';
    }
    
    // 格式化為中文日期時間格式
    return dateObj.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  } catch (error) {
    console.error('日期格式化錯誤:', error, '原始日期:', date);
    return '日期不詳';
  }
}


// 在組件掛載時載入新聞列表
onMounted(async () => {
    try {
        loading.value = true;
        await newstore.getAllnewsies();
        // 初始化 displayedNews
        displayedNews.value = [];
        // 初始載入第一頁
        await loadMoreNews();
    } catch (error) {
        console.error('Error loading news:', error);
        message.error('載入新聞失敗');
    } finally {
        loading.value = false;
    }
})
const goToNewspage = async (newsId: string) => {
  try {
    // 增加點擊數
    await fetch(`https://view-truth.zeabur.app/api/news/increment-count/${newsId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    await router.push({
      name: 'newspage',
      params: { id: newsId }
    })
  } catch (error) {
    message.error('無法開啟新聞')
    console.error('Error navigating to newspage:', error)
  }
}
// 處理最大字數
const maxLength = 50 // 最大字數限制

const getLevelClass = (level: string) => {
    switch(level?.toLowerCase()) {
        case 'high': return 'level-high';
        case 'medium': return 'level-medium';
        case 'low': return 'level-low';
        default: return 'level-unknown';
    }
};

const searchText = ref('');

// 日期範圍選擇器相關
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
const dateFormat = 'YYYY-MM-DD';

// 標籤篩選相關
const selectedTags = ref<string[]>([]);
const availableTags = computed(() => {
    const tags = new Set<string>();
    newsies.value.forEach(news => {
        if (news.event_type) {
            tags.add(news.event_type);
        }
    });
    return Array.from(tags);
});

// 更新篩選邏輯
const filteredNews = computed(() => {
    let filtered = newsies.value;

    // 文字搜尋
    if (searchText.value) {
        const searchLower = searchText.value.toLowerCase();
        filtered = filtered.filter(news => 
            news.title?.toLowerCase().includes(searchLower) ||
            news.content?.toLowerCase().includes(searchLower) ||
            news.event_type?.toLowerCase().includes(searchLower)
        );
    }

    // 日期範圍篩選
    if (dateRange.value) {
        const [startDate, endDate] = dateRange.value;
        filtered = filtered.filter(news => {
            const newsDate = dayjs(news.analysis_timestamp);
            return newsDate.isAfter(startDate) && newsDate.isBefore(endDate.add(1, 'day'));
        });
    }

    // 標籤篩選
    if (selectedTags.value.length > 0) {
        filtered = filtered.filter(news => 
            selectedTags.value.includes(news.event_type)
        );
    }

    return filtered;
});

// 日期範圍變更處理
const onDateRangeChange = () => {
    currentPage.value = 1;
    displayedNews.value = [];
    hasMore.value = true;
    loadMoreNews();
};

// 標籤變更處理
const onTagChange = () => {
    currentPage.value = 1;
    displayedNews.value = [];
    hasMore.value = true;
    loadMoreNews();
};

const onSearch = (value: string) => {
    searchText.value = value;
    currentPage.value = 1;
    displayedNews.value = [];
    hasMore.value = true;
    loadMoreNews();
};

const formatContent = (content: string) => {
    return content.length > maxLength ? content.slice(0, maxLength) + "..." : content;
};

const getScoreStyle = (score: number) => {
    if (!score) return { color: '#8c8c8c' };
    if (score >= 80) return { color: '#52c41a' }; // 80-100分 綠色
    if (score >= 60) return { color: '#faad14' }; // 60-79分 黃色
    return { color: '#ff4d4f' }; // 低於60分 紅色
};

const getLevelColor = (level: string) => {
    switch(level?.toLowerCase()) {
        case 'high': return 'success';
        case 'medium': return 'warning';
        case 'low': return 'error';
        default: return 'default';
    }
};
</script>

<style scoped>
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
    background: linear-gradient(45deg, #1890ff, #52c41a);
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

.info-icon:hover {
    color: #40a9ff;
    transform: scale(1.2);
}

.filter-section {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;
}

.filter-space {
    width: 100%;
}

.filter-item {
    width: 100%;
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
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 8px;
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

.news-card:hover .news-title {
    color: #1890ff;
}

.news-type {
    padding: 2px 12px;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
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
}

.score-statistic:hover {
    background: rgba(24, 144, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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

.read-more-btn:hover {
    transform: translateX(4px);
}

:deep(.ant-statistic-title) {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
}

:deep(.ant-statistic-content) {
    font-size: 24px;
    font-weight: 600;
    display: flex;
    justify-content: center;
    align-items: baseline;
}

:deep(.ant-statistic-content-value) {
    margin-right: 4px;
}

:deep(.ant-input-search .ant-input) {
    border-radius: 6px;
    height: 40px;
}

:deep(.ant-input-search .ant-input-search-button) {
    border-radius: 0 6px 6px 0;
    height: 40px;
}

:deep(.ant-select-selector) {
    border-radius: 6px !important;
    height: 40px !important;
    padding: 4px 11px !important;
}

:deep(.ant-picker) {
    border-radius: 6px;
    height: 40px;
}

.loading-more {
    text-align: center;
    margin: 24px 0;
    height: 60px;
    line-height: 60px;
}

/* 動畫效果 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.news-card {
    animation: fadeIn 0.5s ease-out;
}

/* 響應式設計優化 */
@media (max-width: 1200px) {
    .news-main-content {
        margin: 0 16px;
    }
}

@media (max-width: 992px) {
    .page-header h2 {
        font-size: 24px;
    }
    
    .news-scores {
        padding: 12px;
    }
    
    :deep(.ant-statistic-content) {
        font-size: 22px;
    }
}

@media (max-width: 768px) {
    .news-main-content {
        padding: 16px;
    }
    
    .title-wrapper {
        margin-bottom: 16px;
    }
    
    .page-header {
        margin-bottom: 24px;
    }
    
    .filter-section {
        padding: 12px;
    }
    
    .news-title {
        font-size: 18px;
    }
    
    :deep(.ant-statistic-content) {
        font-size: 20px;
    }
    
    .score-statistic {
        margin-bottom: 8px;
    }
    
    .content-wrapper {
        margin: 16px 12px 0 !important;
    }
}

@media (max-width: 576px) {
    .news-main-content {
        padding: 12px;
        border-radius: 6px;
        margin: 0 8px;
    }
    
    .page-header h2 {
        font-size: 20px;
    }
    
    .news-card {
        margin-bottom: 16px;
    }
    
    .news-scores {
        margin: 12px 0;
        padding: 8px;
    }
    
    :deep(.ant-statistic-content) {
        font-size: 18px;
    }
    
    :deep(.ant-statistic-title) {
        font-size: 13px;
    }
    
    .score-statistic {
        padding: 8px 4px;
    }
    
    .news-content {
        padding: 12px 0;
    }
    
    .news-summary {
        font-size: 14px;
        line-height: 1.6;
    }
    
    .news-footer {
        margin-top: 16px;
        padding-top: 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    
    :deep(.ant-tag) {
        padding: 1px 8px;
        font-size: 12px;
    }
    
    .news-type {
        padding: 1px 8px;
        font-size: 12px;
    }
    
    .content-wrapper {
        margin: 16px 8px 0 !important;
    }
}

/* 自定義滾動條 */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 標籤樣式優化 */
:deep(.ant-tag) {
    border-radius: 16px;
    padding: 2px 12px;
    font-size: 13px;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 空狀態樣式 */
:deep(.ant-empty) {
    margin: 32px 0;
}

/* 載入動畫 */
:deep(.ant-spin) {
    margin: 16px auto;
}

:deep(.ant-spin-text) {
    margin-top: 8px;
    color: #1890ff;
}
</style>

