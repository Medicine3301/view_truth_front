import { defineStore } from 'pinia';
import axios from 'axios';
import { notification } from 'ant-design-vue';

// API 回傳的數據介面
interface ApiOverviewResponse {
  overview: {
    daily_visits: number;
    active_users: number;
    avg_duration: number;
    bounce_rate: number;
  };
  visit_data: Array<{
    date: string;
    visits: number;
  }>;
  popular_pages: Array<{
    path: string;
    page_views: number;
    avg_duration: number;
  }>;
  source_data: Array<{
    name: string;
    value: number;
  }>;
  behavior_data: {
    nodes: Array<{
      name: string;
    }>;
    links: Array<{
      source: string;
      target: string;
      value: number;
    }>;
  };
}

interface ApiRealtimeResponse {
  current_visits: number;
  active_users: number;
  realtime_page_views: Array<{
    path: string;
    active_users: number;
  }>;
}

interface ApiCustomResponse {
  data: Array<{
    date: string;
    metrics: {
      visits: number;
      active_users: number;
      avg_duration: number;
      bounce_rate: number;
    };
  }>;
}

// Store 狀態介面
interface AnalyticsState {
  loading: boolean;
  error: string | null;
  overview: {
    dailyVisits: number;
    activeUsers: number;
    avgDuration: number;
    bounceRate: number;
  };
  visitData: Array<{
    date: string;
    visits: number;
  }>;
  popularPages: Array<{
    path: string;
    pageViews: number;
    avgDuration: number;
  }>;
  sourceData: Array<{
    name: string;
    value: number;
  }>;
  behaviorData: {
    nodes: Array<{
      name: string;
    }>;
    links: Array<{
      source: string;
      target: string;
      value: number;
    }>;
  };
  realtimeData: {
    currentVisits: number;
    activeUsers: number;
    pageViews: Array<{
      path: string;
      activeUsers: number;
    }>;
  };
}

export const useAnalyticsStore = defineStore('analytics', {
  state: (): AnalyticsState => ({
    loading: false,
    error: null,
    overview: {
      dailyVisits: 0,
      activeUsers: 0,
      avgDuration: 0,
      bounceRate: 0
    },
    visitData: [],
    popularPages: [],
    sourceData: [],
    behaviorData: {
      nodes: [],
      links: []
    },
    realtimeData: {
      currentVisits: 0,
      activeUsers: 0,
      pageViews: []
    }
  }),

  actions: {
    // 獲取分析數據
    async fetchAnalyticsData(params: {
      startDate: string;
      endDate: string;
      granularity: string;
    }) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get<ApiOverviewResponse>('https://realeye.zeabur.app/api/analytics/overview', {
          params
        });

        if (response.status === 200) {
          const data = response.data;
          
          // 轉換 API 回傳的數據格式
          this.overview = {
            dailyVisits: data.overview.daily_visits,
            activeUsers: data.overview.active_users,
            avgDuration: data.overview.avg_duration,
            bounceRate: data.overview.bounce_rate
          };

          this.visitData = data.visit_data;
          
          this.popularPages = data.popular_pages.map(page => ({
            path: page.path,
            pageViews: page.page_views,
            avgDuration: page.avg_duration
          }));

          this.sourceData = data.source_data;
          this.behaviorData = data.behavior_data;

          return {
            dailyVisits: this.overview.dailyVisits,
            activeUsers: this.overview.activeUsers,
            avgDuration: this.overview.avgDuration,
            bounceRate: this.overview.bounceRate,
            popularPages: this.popularPages,
            maxPageViews: Math.max(...this.popularPages.map(page => page.pageViews)),
            visitData: this.visitData,
            sourceData: this.sourceData,
            behaviorData: this.behaviorData
          };
        }

        throw new Error('Failed to fetch analytics data');
      } catch (error: any) {
        this.error = error.response?.data?.message || '獲取分析數據失敗';
        
        // 處理特定的 Sankey 圖表錯誤
        if (error.message && error.message.includes('Sankey is a DAG')) {
          this.error = 'Sankey 圖表數據中存在循環依賴';
          console.warn('檢測到 Sankey 圖表數據中存在循環依賴，某些連接可能無法顯示。');
        }
        
        notification.error({
          message: '錯誤',
          description: this.error
        });
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 獲取即時訪問數據
    async fetchRealtimeData() {
      try {
        const response = await axios.get<ApiRealtimeResponse>('https://realeye.zeabur.app/api/analytics/realtime');
        
        if (response.status === 200) {
          const data = response.data;
          this.realtimeData = {
            currentVisits: data.current_visits,
            activeUsers: data.active_users,
            pageViews: data.realtime_page_views.map(view => ({
              path: view.path,
              activeUsers: view.active_users
            }))
          };
          return this.realtimeData;
        }

        throw new Error('Failed to fetch realtime data');
      } catch (error: any) {
        notification.error({
          message: '錯誤',
          description: '獲取即時數據失敗'
        });
        throw error;
      }
    },

    // 獲取自定義時間範圍的數據
    async fetchCustomRangeData(params: {
      startDate: string;
      endDate: string;
      metrics: string[];
    }) {
      try {
        const response = await axios.get<ApiCustomResponse>('https://realeye.zeabur.app/api/analytics/custom', {
          params
        });

        if (response.status === 200) {
          return response.data;
        }

        throw new Error('Failed to fetch custom range data');
      } catch (error: any) {
        notification.error({
          message: '錯誤',
          description: '獲取自定義數據失敗'
        });
        throw error;
      }
    },

    // 匯出分析報告
    async exportAnalyticsReport(params: {
      startDate: string;
      endDate: string;
      format: 'pdf' | 'excel';
    }) {
      try {
        const response = await axios.get('https://realeye.zeabur.app/api/analytics/export', {
          params,
          responseType: 'blob'
        });

        if (response.status === 200) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `analytics_report_${params.startDate}_to_${params.endDate}.${params.format}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          return true;
        }

        throw new Error('Failed to export report');
      } catch (error: any) {
        notification.error({
          message: '錯誤',
          description: '匯出報告失敗'
        });
        throw error;
      }
    }
  }
}); 