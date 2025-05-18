import { defineStore } from 'pinia';
import axios from 'axios';
import { notification } from 'ant-design-vue';

// API 回傳的數據介面
export interface ContentAnalysisItem {
  nid: number;
  title: string;
  content: string;
  publish_date: string;
  location: string;
  event_type: string;
  credibility_score: number | null;
  credibility_level: string;
  factual_score: number | null;
  critical_score: number | null;
  balanced_score: number | null;
  source_score: number | null;
  factual_analysis: any;
  critical_analysis: any;
  balanced_analysis: any;
  source_analysis: any;
  verification_guide: any;
  analysis_timestamp: string;
  created_at: string;
  link: string;
  Pending: '0' | '1';
  img: string;
  count: number;
}

// Store 狀態介面
interface ContentAnalysisState {
  loading: boolean;
  error: string | null;
  contentList: ContentAnalysisItem[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  selectedContent: ContentAnalysisItem | null;
}

export const useContentAnalysisStore = defineStore('contentAnalysis', {
  state: (): ContentAnalysisState => ({
    loading: false,
    error: null,
    contentList: [],
    totalItems: 0,
    currentPage: 1,
    pageSize: 10,
    selectedContent: null
  }),

  actions: {
    // 獲取內容分析列表
    async fetchContentAnalysisList(params: {
      page: number;
      pageSize: number;
      pending?: string;
      searchQuery?: string;
      eventType?: string;
      startDate?: string;
      endDate?: string;
      sortField?: string;
      sortOrder?: string;
    }) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get('https://realeye.zeabur.app/api/content-analysis', {
          params
        });

        if (response.status === 200) {
          this.contentList = response.data.items;
          this.totalItems = response.data.total;
          this.currentPage = params.page;
          this.pageSize = params.pageSize;
          return {
            items: this.contentList,
            total: this.totalItems
          };
        }

        throw new Error('無法獲取內容分析列表');
      } catch (error: any) {
        this.error = error.response?.data?.message || '獲取內容分析列表失敗';
        notification.error({
          message: '錯誤',
          description: this.error
        });
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 獲取內容分析詳情
    async fetchContentDetail(nid: number) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`https://realeye.zeabur.app/api/content-analysis/${nid}`);

        if (response.status === 200) {
          let detailData = response.data;
          // 檢查實際內容是否嵌套在 'content' 鍵下
          if (detailData && typeof detailData === 'object' && 'content' in detailData && 
              detailData.content !== null && typeof detailData.content === 'object') {
            console.log('[Store] 從 response.data.content 解包內容詳情');
            detailData = detailData.content;
          } else if (detailData && typeof detailData === 'object' && 'content' in detailData && detailData.content === null) {
             console.warn('[Store] "content" 鍵下的內容詳情為 null。');
             // 根據 API 對「未找到」的預期行為，可能需要拋出錯誤或返回 null
             // 例如: throw new Error('內容詳情數據為空');
          }
          
          this.selectedContent = detailData as ContentAnalysisItem;
          return this.selectedContent;
        }

        throw new Error('無法獲取內容詳情');
      } catch (error: any) {
        this.error = error.response?.data?.message || '獲取內容詳情失敗';
        notification.error({
          message: '錯誤',
          description: this.error
        });
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 更新內容審核狀態
    async updateContentStatus(params: {
      nid: number;
      pending: '0' | '1';
      rejectReason?: string;
    }) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.patch(`https://realeye.zeabur.app/api/content-analysis/${params.nid}/status`, {
          pending: params.pending,
          reject_reason: params.rejectReason
        });

        if (response.status === 200) {
          notification.success({
            message: '成功',
            description: params.pending === '1' ? '內容已審核通過' : '內容已標記為待審核'
          });
          
          // 更新本地列表中的狀態
          const index = this.contentList.findIndex(item => item.nid === params.nid);
          if (index !== -1) {
            this.contentList[index].Pending = params.pending;
          }
          
          // 如果有選中項，也更新選中項
          if (this.selectedContent && this.selectedContent.nid === params.nid) {
            this.selectedContent.Pending = params.pending;
          }
          
          return response.data;
        }

        throw new Error('更新內容狀態失敗');
      } catch (error: any) {
        this.error = error.response?.data?.message || '更新內容狀態失敗';
        notification.error({
          message: '錯誤',
          description: this.error
        });
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 批量更新內容審核狀態
    async batchUpdateContentStatus(params: {
      nids: number[];
      pending: '0' | '1';
    }) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.patch('https://realeye.zeabur.app/api/content-analysis/batch-status', {
          nids: params.nids,
          pending: params.pending
        });

        if (response.status === 200) {
          notification.success({
            message: '成功',
            description: `已批量${params.pending === '1' ? '審核通過' : '標記為待審核'}${params.nids.length}項內容`
          });
          
          // 更新本地列表中的狀態
          params.nids.forEach(nid => {
            const index = this.contentList.findIndex(item => item.nid === nid);
            if (index !== -1) {
              this.contentList[index].Pending = params.pending;
            }
          });
          
          return response.data;
        }

        throw new Error('批量更新內容狀態失敗');
      } catch (error: any) {
        this.error = error.response?.data?.message || '批量更新內容狀態失敗';
        notification.error({
          message: '錯誤',
          description: this.error
        });
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 刪除內容
    async deleteContent(nid: number) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.delete(`https://realeye.zeabur.app/api/content-analysis/${nid}`);

        if (response.status === 200) {
          notification.success({
            message: '成功',
            description: '內容已刪除'
          });
          
          // 從本地列表中移除
          this.contentList = this.contentList.filter(item => item.nid !== nid);
          
          // 如果刪除的是選中項，清空選中項
          if (this.selectedContent && this.selectedContent.nid === nid) {
            this.selectedContent = null;
          }
          
          return response.data;
        }

        throw new Error('刪除內容失敗');
      } catch (error: any) {
        this.error = error.response?.data?.message || '刪除內容失敗';
        notification.error({
          message: '錯誤',
          description: this.error
        });
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 獲取統計數據
    async fetchStatistics() {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get('https://realeye.zeabur.app/api/content-analysis/statistics');

        if (response.status === 200) {
          return response.data;
        }

        throw new Error('無法獲取統計數據');
      } catch (error: any) {
        this.error = error.response?.data?.message || '獲取統計數據失敗';
        notification.error({
          message: '錯誤',
          description: this.error
        });
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
}); 