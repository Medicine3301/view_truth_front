<template>
    <a-layout>
        <Sidebar v-model:collapsed="collapsed" :onCollapse="onCollapse" />
        <a-layout :style="{ marginLeft: layoutMargin }">
            <Header />
            <a-layout-content :style="{ background: '#f5f5f5', margin: '24px 16px 0' }">
                <!-- 頂部引導區域 -->
                <a-card class="page-header" :bordered="false">
                    <div class="logo-container">
                        <div class="logo-wrapper">
                            <img src="../assets/logo.png" alt="識真網 Logo" class="logo-image" />
                        </div>
                        <div class="header-text">
                            <a-typography-title :level="1" class="site-title">識真網</a-typography-title>
                            <a-typography-paragraph class="site-description">
                                視真於微 思辨於心 讓真相 不再被聲量掩埋
                            </a-typography-paragraph>
                            <a-space>
                                <a-button type="primary" size="large" @click="scrollToSearch">
                                    <template #icon><search-outlined /></template>
                                    開始搜尋
                                </a-button>
                                <a-button size="large" @click="scrollToGuide">
                                    <template #icon><info-circle-outlined /></template>
                                    使用指南
                                </a-button>
                            </a-space>
                        </div>
                    </div>
                </a-card>

                <div class="main-content">
                    <!-- 重要提示信息 -->
                    <div class="notice-container">
                    <a-collapse>
                            <a-collapse-panel key="1">
                                <template #header>
                                    <div class="notice-header">
                                        <info-circle-outlined class="notice-icon" />
                                        <span class="notice-title">使用指南</span>
                                    </div>
                                </template>
                                
                                <div class="guide-content">
                                    <div class="guide-section">
                                        <div class="section-header">
                                            <number-outlined class="section-icon" />
                                            <h4>瀏覽新聞</h4>
                                        </div>
                                        <p>查看最新的新聞分析報告</p>
                                    </div>

                                    <div class="guide-section">
                                        <div class="section-header">
                                            <number-outlined class="section-icon" />
                                            <h4>搜尋功能</h4>
                                        </div>
                                        <p>使用關鍵字尋找特定內容</p>
                                    </div>

                                    <div class="guide-section">
                                        <div class="section-header">
                                            <number-outlined class="section-icon" />
                                            <h4>評分解讀</h4>
                                        </div>
                                        <p>透過事實性、批判性、客觀性、來源檢查四個角度</p>
                                        <p>全面理解內容品質</p>
                                    </div>

                                    <div class="guide-section">
                                        <div class="section-header">
                                            <number-outlined class="section-icon" />
                                            <h4>深入分析</h4>
                                        </div>
                                        <p>點擊「查看完整分析」了解詳細內容</p>
                                    </div>

                                    <div class="guide-section">
                                        <div class="section-header">
                                            <number-outlined class="section-icon" />
                                            <h4>評分標準</h4>
                                        </div>
                                        <div class="score-criteria">
                                            <div class="criteria-item">
                                                <check-circle-outlined class="criteria-icon" />
                                                <span>可信度：衡量新聞來源的可靠性和可信度</span>
                                            </div>
                                            <div class="criteria-item">
                                                <check-circle-outlined class="criteria-icon" />
                                                <span>事實性：評估新聞報導的準確性和事實性</span>
                                            </div>
                                            <div class="criteria-item">
                                                <check-circle-outlined class="criteria-icon" />
                                                <span>客觀性：評估新聞報導的公正性和客觀性</span>
                                            </div>
                                            <div class="criteria-item">
                                                <check-circle-outlined class="criteria-icon" />
                                                <span>批判性：評估新聞報導的批判性和分析性</span>
                                            </div>
                                            <div class="criteria-item">
                                                <check-circle-outlined class="criteria-icon" />
                                                <span>來源檢查：評估新聞報導的來源檢查和引用</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="guide-section">
                                        <div class="section-header">
                                            <number-outlined class="section-icon" />
                                            <h4>重要提醒</h4>
                                        </div>
                                        <div class="reminder-box">
                                            <warning-outlined class="reminder-icon" />
                                            <div class="reminder-content">
                                                <p>我們的分析分數僅供參考</p>
                                                <p>建議讀者詳閱分析報告並進行實際查證後再做出判斷</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a-collapse-panel>
                        </a-collapse>
                    </div>

                    <!-- 搜尋區域 -->
                    <div class="search-container">
                        <div class="search-header">
                            <h2>搜尋網路內容分析</h2>
                            <p>輸入關鍵字搜尋您感興趣的內容</p>
                        </div>
                        <div class="search-controls">
                            <a-range-picker
                                v-model:value="dateRange"
                                format="YYYY-MM-DD"
                                :placeholder="['開始日期', '結束日期']"
                                @change="onDateRangeChange"
                                class="date-picker"
                            />
                            <a-input-search
                                v-model:value="searchText"
                                placeholder="試試輸入：台灣、選舉、政治..."
                                class="search-input"
                                @search="onSearch"
                                enter-button="搜尋"
                            />
                        </div>
                        <!-- 優化分類標籤 -->
                        <div class="category-section">
                            <div class="category-header">
                                <div class="category-title-wrapper">
                                    <tags-outlined class="category-icon" />
                                    <span class="category-title">分類</span>
                                    <a-divider />
                                </div>
                            </div>
                            <div class="category-tags" :class="{ 'category-panel-open': isCategoryPanelOpen }">
                                <a-tag 
                                    v-for="tag in eventTypes" 
                                    :key="tag"
                                    :class="{ 'tag-selected': selectedCategory === tag }"
                                    @click="selectCategory(tag)"
                                    class="category-tag"
                                >
                                    {{ tag }}
                                    <check-outlined v-if="selectedCategory === tag" class="tag-check-icon" />
                                </a-tag>
                            </div>
                        </div>
                    </div>

                    <!-- 新聞列表 -->
                    <a-spin :spinning="loading">
                        <a-list :data-source="displayedNews" :row-key="(item) => item?.nid"
                            :grid="{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }">
                            <template #renderItem="{ item: news }">
                                <a-list-item>
                                    <a-card hoverable class="news-card"
                                        @click="goToNewspage(news.nid)">
                                        <div class="news-image-wrapper">
                                            <img :src="news.img || 'default-news-image.jpg'" :alt="news.title" class="news-image-content"/>
                                        </div>
                                        <div class="news-content">
                                            <h3 class="news-title">{{ news.title }}</h3>
                                            <a-tag :color="getEventTypeColor(news.event_type)">{{ news.event_type || '一般新聞' }}</a-tag>

                                            <div class="news-scores">
                                                <a-row :gutter="[8, 8]"> <a-col :xs="24" :sm="8">
                                                        <a-statistic title="可信度" :value="news.credibility_score"
                                                            :precision="1"
                                                            :value-style="getScoreStyle(news.credibility_score)" />
                                                    </a-col>
                                                    <a-col :xs="24" :sm="8">
                                                        <a-statistic title="事實性" :value="news.factual_score"
                                                            :precision="1"
                                                            :value-style="getScoreStyle(news.factual_score)" />
                                                    </a-col>
                                                    <a-col :xs="24" :sm="8">
                                                        <a-statistic title="客觀性" :value="news.balanced_score"
                                                            :precision="1"
                                                            :value-style="getScoreStyle(news.balanced_score)" />
                                                    </a-col>
                                                </a-row>
                                            </div>
                                            <p class="news-summary">{{ formatContent(news.content) }}</p>
                                            <div class="news-footer">
                                                <a-space direction="vertical" style="width: 100%;">
                                                    <a-tag class="date-tag">{{ formatDate(news.analysis_timestamp) }}</a-tag>
                                                    <a-button type="primary" block @click.stop="goToNewspage(news.nid)">
                                                        查看完整分析
                                                        <RightOutlined />
                                                    </a-button>
                                                </a-space>
                                            </div>
                                        </div>
                                    </a-card>
                                </a-list-item>
                            </template>
                        </a-list>
                        <div class="loading-more" ref="loadingTrigger">
                            <a-spin v-if="loadingMore" />
                        </div>
                    </a-spin>
                </div>
            </a-layout-content>
            <a-layout-footer class="custom-footer">
                識真網 ©2024 Created by View Truth Team
            </a-layout-footer>
        </a-layout>
    </a-layout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { 
    RightOutlined, 
    InfoCircleOutlined, 
    NumberOutlined, 
    CheckCircleOutlined, 
    WarningOutlined, 
    DownOutlined,
    TagsOutlined,
    CheckOutlined,
    SearchOutlined
} from '@ant-design/icons-vue';
import { useAuthStore } from '../stores/auth';
import { message } from 'ant-design-vue';
import router from '../router';
import { useIntersectionObserver } from '@vueuse/core';
import Sidebar from '../layout/sidebar.vue';
import Header from '../layout/header.vue';
import type { Dayjs } from 'dayjs';

// 引入 auth store
const newstore = useAuthStore();
const newsies = computed(() => newstore.newstate?.newsies || []);

// 側邊欄狀態
const collapsed = ref(false);
const broken = ref(false);

const layoutMargin = computed(() => {
    if (broken.value) {
        return collapsed.value ? '0px' : '200px';
    }
    return collapsed.value ? '0px' : '200px'; // 根據需求調整寬度
});

const onCollapse = (val: boolean, type: string) => {
    console.log(val, type);
    collapsed.value = val;
};

// 新增搜尋和分頁相關程式碼
const searchText = ref('');
const loading = ref(true);
const loadingMore = ref(false);
const hasMore = ref(true);
const loadingTrigger = ref<HTMLElement | null>(null);
const displayedNews = ref<any[]>([]);
const pageSize = ref(10);
const currentPage = ref(1);

// 新增日期範圍狀態
const dateRange = ref<[Dayjs, Dayjs] | null>(null);

// 新增分類面板狀態
const isCategoryPanelOpen = ref(false);
const toggleCategoryPanel = () => {
    isCategoryPanelOpen.value = !isCategoryPanelOpen.value;
};

// 分類標籤相關
const selectedCategory = ref<string | null>(null);
const eventTypes = computed(() => {
    const types = new Set(newsies.value.map(news => news.event_type).filter(Boolean));
    return Array.from(types);
});

const selectCategory = (category: string) => {
    selectedCategory.value = selectedCategory.value === category ? null : category;
    currentPage.value = 1;
    displayedNews.value = [];
    hasMore.value = true;
    loadMoreNews();
};

// 新增統計數據計算
const averageCredibility = computed(() => {
    const scores = newsies.value.map(news => news.credibility_score).filter(Boolean);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
});

const averageFactual = computed(() => {
    const scores = newsies.value.map(news => news.factual_score).filter(Boolean);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
});

const averageBalanced = computed(() => {
    const scores = newsies.value.map(news => news.balanced_score).filter(Boolean);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
});

const averageSource = computed(() => {
    const scores = newsies.value.map(news => news.source_score).filter(Boolean);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
});

// 熱門新聞計算
const hotNews = computed(() => {
    return newsies.value
        .sort((a, b) => {
            const scoreA = (a.credibility_score + a.factual_score) / 2;
            const scoreB = (b.credibility_score + b.factual_score) / 2;
            return scoreB - scoreA;
        })
        .slice(0, 5);
});

const getScoreStyle = (score: number) => {
    if (!score) return { color: '#8c8c8c' };
    if (score >= 8) return { color: '#52c41a' };
    if (score >= 6) return { color: '#faad14' };
    return { color: '#ff4d4f' };
};

const formatContent = (content: string) => {
    const maxLength = 200;
    return content?.length > maxLength ? content.slice(0, maxLength) + "..." : content;
};

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
        
        // 格式化為中文日期格式
        return dateObj.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');
    } catch (error) {
        console.error('日期格式化錯誤:', error, '原始日期:', date);
        return '日期不詳';
    }
};

// 修改過濾邏輯
const filteredNews = computed(() => {
    let filtered = newsies.value;

    // 首先根據 pending 狀態進行過濾
    filtered = filtered.filter(news => {
        // 輸出日誌，顯示新聞ID和其 Pending 狀態
        console.log(`新聞 ID: ${news.nid}, Pending 狀態: ${news.Pending}`);
        // 根據 auth.ts 中的定義，Pending 是字串類型
        return news.Pending === "1";
    });

    // 關鍵字搜尋
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
            const newsDate = new Date(news.analysis_timestamp);
            return newsDate >= startDate.toDate() && newsDate <= endDate.toDate();
        });
    }

    // 分類篩選
    if (selectedCategory.value) {
        filtered = filtered.filter(news => news.event_type === selectedCategory.value);
    }

    // 按日期排序（最新的在前）
    return filtered.sort((a, b) => {
        const dateA = new Date(a.analysis_timestamp).getTime();
        const dateB = new Date(b.analysis_timestamp).getTime();
        return dateB - dateA;
    });
});

// 日期範圍變更處理
const onDateRangeChange = () => {
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

// 跳转到新闻详情页
const goToNewspage = async (newsId: string) => {
    try {
        // 增加點擊數
        await fetch(`https://realeye.zeabur.app/api/news/increment-count/${newsId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        await router.push({
            name: 'newspage',
            params: { id: newsId }
        });
    } catch (error) {
        message.error('無法開啟新聞');
        console.error('Error navigating to newspage:', error);
    }
};

// 在组件加载时获取新闻列表
onMounted(async () => {
    try {
        loading.value = true;
        await newstore.getAllnewsies();
        displayedNews.value = [];
        await loadMoreNews();
    } catch (error) {
        console.error('Error loading news:', error);
        message.error('載入新聞失敗');
    } finally {
        loading.value = false;
    }
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

// 根據事件類型獲取標籤顏色
const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
        case '政治事件':
            return 'purple';
        case '經濟事件':
            return 'green';
        case '社會事件':
            return 'volcano';
        case '科技發展':
            return 'geekblue';
        case '環境保護':
            return 'cyan';
        case '文化藝術':
            return 'magenta';
        case '教育動態':
            return 'orange';
        case '健康醫療':
            return 'lime';
        case '災害意外':
            return 'red';
        case '國際關係':
            return 'gold';
        default:
            return 'blue';
    }
};

// 確保圖片在卡片內部正確顯示
const defaultImage = new URL('../assets/default-news-image.jpg', import.meta.url).href;

// 新增滾動功能
const scrollToSearch = () => {
    const searchContainer = document.querySelector('.search-container');
    searchContainer?.scrollIntoView({ behavior: 'smooth' });
};

const scrollToGuide = () => {
    const guideContainer = document.querySelector('.notice-container');
    guideContainer?.scrollIntoView({ behavior: 'smooth' });
};

</script>

<style scoped>
/* 基礎響應式設定 */
:root {
  --max-width: 1400px;
  --content-padding: 24px;
  --card-min-width: 300px;
  --card-max-width: 400px;
  --grid-columns: 2;
}

/* 頁面容器 */
.main-content {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--content-padding);
}

/* 頁首區域 */
.page-header {
    background: linear-gradient(135deg, #2c5282 0%, #4299e1 100%);
    padding: clamp(24px, 5vw, 40px) clamp(16px, 3vw, 32px);
    color: white;
    border-radius: 16px;
    margin-bottom: clamp(24px, 4vw, 32px);
    box-shadow: 0 4px 20px rgba(66, 153, 225, 0.15);
}

.page-header :deep(.ant-card-body) {
    padding: 0;
}

.logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(24px, 4vw, 48px);
    flex-wrap: wrap;
    padding: 20px;
}

.logo-wrapper {
    position: relative;
    padding: 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    backdrop-filter: blur(8px);
    transition: all 0.3s ease;
}

.logo-wrapper:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
}

.logo-image {
    width: 140px;
    height: auto;
    display: block;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
    transition: all 0.3s ease;
}

.logo-wrapper:hover .logo-image {
    transform: scale(1.02);
    filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.15));
}

.header-text {
    text-align: center;
    flex: 1;
    min-width: 300px;
}

.site-title {
    color: #ffffff !important;
    font-size: 2.5em !important;
    margin-bottom: 16px !important;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.site-description {
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 1.2em !important;
    margin-bottom: 24px !important;
    line-height: 1.6 !important;
}

.header-text :deep(.ant-space) {
    margin-top: 16px;
}

.header-text :deep(.ant-btn) {
    height: 40px;
    padding: 0 24px;
    font-size: 16px;
    border-radius: 20px;
    transition: all 0.3s ease;
}

.header-text :deep(.ant-btn-primary) {
    background: #ffffff;
    border-color: #ffffff;
    color: #2c5282;
}

.header-text :deep(.ant-btn-primary:hover) {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-text :deep(.ant-btn-default) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
}

.header-text :deep(.ant-btn-default:hover) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
    .logo-container {
        flex-direction: column;
        text-align: center;
    }

    .site-title {
        font-size: 2em !important;
    }

    .site-description {
        font-size: 1.1em !important;
    }
}

/* 使用指南區域 */
.notice-container {
  margin-bottom: 24px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.notice-header {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 16px;
  color: #333;
}

.notice-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #1890ff;
}

.notice-title {
  font-weight: bold;
}

.guide-content {
  padding: 16px;
}

.guide-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.section-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #1890ff;
}

.guide-section h4 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 0;
  color: #333;
}

.guide-section p {
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  margin-left: 26px;
}

.score-criteria {
  margin-left: 26px;
}

.criteria-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
}

.criteria-icon {
  margin-right: 8px;
  color: #52c41a;
  font-size: 16px;
}

.reminder-box {
  display: flex;
  align-items: flex-start;
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 4px;
  padding: 12px 16px;
  margin-left: 26px;
}

.reminder-icon {
  font-size: 20px;
  color: #faad14;
  margin-right: 12px;
  margin-top: 2px;
}

.reminder-content p {
  margin-bottom: 4px;
  font-size: 14px;
  color: #8c6c0a;
  line-height: 1.5;
}

.reminder-content p:last-child {
  margin-bottom: 0;
}

/* 搜尋區域 */
.search-container {
  margin-bottom: 30px;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-header {
  text-align: center;
  margin-bottom: 20px;
}

.search-header h2 {
  font-size: 22px;
  color: #1a2a4c;
  margin-bottom: 8px;
}

.search-header p {
  font-size: 15px;
  color: #666;
}

.search-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.date-picker {
  flex-grow: 1;
  min-width: 200px;
}

.search-input {
  flex-grow: 2;
  min-width: 250px;
}

/* 分類標籤區域 */
.category-section {
  margin-top: 20px;
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.category-title-wrapper {
  display: flex;
  align-items: center;
  font-size: 18px;
  color: #333;
  font-weight: 500;
}

.category-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #1890ff;
}

.category-title {
  margin-right: 12px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-tag {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  background-color: #f0f2f5;
  color: #555;
  border: 1px solid transparent;
}

.category-tag:hover {
  background-color: #e6f7ff;
  border-color: #91d5ff;
  color: #096dd9;
}

.tag-selected {
  background-color: #1890ff !important;
  color: white !important;
  border-color: #1890ff !important;
  font-weight: bold;
}

.tag-check-icon {
  margin-left: 6px;
  font-size: 12px;
}

/* 卡片樣式 */
.news-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 12px !important;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

.news-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
}

.news-image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.news-image-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.news-card:hover .news-image-content {
  transform: scale(1.05);
}

.news-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.news-title {
  font-size: 1.3em;
  font-weight: bold;
  margin-bottom: 12px;
  line-height: 1.4;
  color: #2c3e50;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.8em;
}

.news-card .ant-tag {
  margin-bottom: 12px;
  font-size: 0.85em;
  padding: 3px 8px;
  border-radius: 4px;
}

.news-scores {
  margin-top: auto;
  margin-bottom: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.news-scores .ant-statistic-title {
  font-size: 0.9em;
  color: #555;
}

.news-scores .ant-statistic-content {
  font-size: 1.4em;
}

.news-summary {
  font-size: 0.95em;
  color: #555;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  min-height: 4.8em;
}

.news-footer {
  margin-top: auto;
  width: 100%;
}

.news-footer .date-tag {
  font-size: 0.85em;
  color: #777;
  margin-bottom: 8px;
  display: block;
  text-align: right;
}

.news-footer .ant-btn {
  width: 100%;
  font-size: 0.95em;
  font-weight: 500;
}

/* 加載更多 */
.loading-more {
  text-align: center;
  padding: 32px 0;
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 頁尾 */
.custom-footer {
  text-align: center;
  padding: 24px;
  color: #4a5568;
  background: #f8fafc;
  font-size: 14px;
  margin-top: 48px;
}
</style>
