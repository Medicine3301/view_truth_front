import { defineStore } from 'pinia'
import axios from 'axios'
import { notification } from 'ant-design-vue'


// 宣告
interface UserState {
    user: {
        uid: string
        una: string
        email: string
        role: string
        birthday: string
        usex: string
        reg_date: string
        avatar?: string
    } | null
    isAuthenticated: boolean
    otherUser: {
        uid: string
        una: string
        email: string
        role: string
        birthday: string
        usex: string
        reg_date: string
        avatar?: string
    } | null
    otherUsers: {
        uid: string;
        una: string;
        email: string;
        role: string;
        birthday: string;
        usex: string;
        reg_date: string;
        avatar?: string;
    }[] | null
    Getuser: {
        uid: string
        una: string
        email: string
        role: string
        reg_date: string
        status: string
    }[] | null
    statistics: {
        totalUsers: number
        monthlyNewUsers: number
        pendingReports: number
        todayActiveUsers: number
    } | null
}

interface UserManagementState {
    users: any[]
    loading: boolean
    total: number
    currentPage: number
    pageSize: number
    selectedUser: any | null
}

interface Community {
    cid: string
    cna: string
    descr: string
    post_count: string
    last_update: string
}
interface post {
    pid: string
    cid: string
    uid: string
    una: string
    title: string
    content: string
    comm_count: string
    crea_date: string
    rate_sc: number
    favorite: number
}
interface comment {
    pid?: string
    nid?: string
    comm_id: string
    uid: string
    una: string
    content: string
    crea_date: string
    parent_id?: string
    children?: comment[]
}
interface CommunityState {
    community: Community | null
    communities: Community[] | null
}
interface Poststate {
    post: post | null
    posts: post[] | null
    favorite: post | null
    favorites: post[] | null
    comment: comment | null
    comments: comment[] | null
}
interface Newstate {
    news: news | null
    newsies: news[] | null
    comment: comment | null
    comments: comment[] | null
}
interface news {
    nid: string  // 改為 nid
    link: string
    img:string
    count:number,
    title: string
    content: string
    publish_date: string
    location: string
    event_type: string
    credibility_score: number
    credibility_level: string
    factual_score: number
    critical_score: number
    balanced_score: number
    source_score: number
    factual_analysis: any
    critical_analysis: any
    balanced_analysis: any
    source_analysis: any
    verification_guide: any
    analysis_timestamp: string
    created_at: string
    updated_at: string
}
interface RegisterUserData {
    name: string
    email: string
    password: string
    sex: string
    birthday: Date
    verificationCode: string
}

// 狀態管理
export const useAuthStore = defineStore('auth', {
    state: (): {
        userState: UserState; 
        communityState: CommunityState;
        postState: Poststate; 
        newstate: Newstate;
        tokenState: {
            accessToken: string | null;
            refreshToken: string | null;
        };
        userManagement: UserManagementState;
    } => ({
        userState: {
            user: null,
            isAuthenticated: false,
            otherUser: null,
            otherUsers: null,
            Getuser: null,
            statistics: null
        },
        communityState: {
            community: null,
            communities: null
        },
        postState: {
            post: null,
            posts: null,
            favorite: null,
            favorites: null,
            comment: null,
            comments: null
        },
        newstate: {
            news: null,
            newsies: null,
            comment: null,
            comments: null
        },
        tokenState: {
            accessToken: localStorage.getItem('accessToken'),
            refreshToken: localStorage.getItem('refreshToken')
        },
        userManagement: {
            users: [],
            loading: false,
            total: 0,
            currentPage: 1,
            pageSize: 10,
            selectedUser: null
        }
    }),
    getters: {
        isAdmin(state): boolean {
            return state.userState.user?.role === 'admin';
        }
    },
    actions: {
        async login(username: string, password: string) {
            try {
                const response = await axios.post('https://view-truth.zeabur.app/api/login', {
                    username,
                    password
                });

                if (response.status === 200) {
                    this.userState.user = response.data.user;
                    this.userState.isAuthenticated = true;
                    
                    // 同時儲存 token 和 tokens
                    localStorage.setItem('token', response.data.access_token);
                    this.setTokens(response.data.access_token, response.data.refresh_token);
                    
                    notification.success({
                        message: '登入成功',
                        description: '歡迎回來！',
                        duration: 3
                    });
                    return true;
                }
                return false;
            } catch (error: any) {
                const errorMessage = error.response?.data?.error || '登入失敗，請稍後再試';
                notification.error({
                    message: '登入失敗',
                    description: errorMessage,
                    duration: 3
                });
                return false;
            }
        },

        async register(userData: RegisterUserData) {
            try {
                const response = await axios.post('https://view-truth.zeabur.app/api/register', userData);

                if (response.status === 201) {
                    notification.success({
                        message: '註冊成功',
                        description: '請登入以繼續',
                        duration: 3
                    });
                    return true;
                }
                return false;
            } catch (error: any) {
                const errorMessage = error.response?.data?.error || '註冊失敗，請稍後再試';
                notification.error({
                    message: '註冊失敗',
                    description: errorMessage,
                    duration: 3
                });
                return false;
            }
        },

        logout() {
            this.userState.user = null;
            this.userState.isAuthenticated = false;
            this.tokenState.accessToken = null;
            this.tokenState.refreshToken = null;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('token'); // 新增這行
            notification.info({
                message: '已登出',
                description: '您已成功登出系統',
                duration: 3
            });
        },

        async checkAuth() {
            const token = localStorage.getItem('token') || this.tokenState.accessToken;
            if (!token) {
                this.logout();
                return false;
            }

            try {
                const response = await axios.get('https://view-truth.zeabur.app/api/verify', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    this.userState.user = response.data.user;
                    this.userState.isAuthenticated = true;
                    return true;
                } else {
                    this.logout();
                    return false;
                }
            } catch (error) {
                this.logout();
                return false;
            }
        },
        //獲取用戶列表(後台)
        async fetchUsers(params: Record<string, any>) {
            this.userManagement.loading = true;
            try {
                const response = await axios.get('https://view-truth.zeabur.app/api/users', { params });
                if (response.status === 200) {
                    this.userManagement.users = response.data.users;
                    this.userManagement.total = response.data.total;
                    this.userManagement.currentPage = response.data.page;
                    this.userManagement.pageSize = response.data.pageSize;
                    return response.data;
                } else {
                    notification.error({
                        message: '加載用戶列表失敗',
                        description: '無法獲取用戶數據，請稍後再試',
                        duration: 3
                    });
                    throw new Error('加載用戶列表失敗');
                }
            } catch (error: any) {
                notification.error({
                    message: '加載用戶列表失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
                throw error;
            } finally {
                this.userManagement.loading = false;
            }
        },
        async getUserInfo(uid: string) {
            try {
                const response = await axios.get(`https://view-truth.zeabur.app/api/user/${uid}`);
                if (response.status === 200) {
                    this.userState.otherUser = response.data.user;
                } else {
                    notification.error({
                        message: '用戶不存在',
                        description: '無法找到該用戶的信息',
                        duration: 3
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: '獲取用戶信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },

        async getCommunityInfo(cid: string) {
            try {
                const response = await axios.get(`https://view-truth.zeabur.app/api/community/${cid}`);
                if (response.status === 200) {
                    this.communityState.community = response.data.community;
                } else {
                    notification.error({
                        message: '社群不存在',
                        description: '無法找到該社群',
                        duration: 3
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: '獲取社群信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },
        async getAllCommunities() {
            try {
                const response = await axios.get('https://view-truth.zeabur.app/api/community/all');
                if (response.status === 200) {
                    this.communityState.communities = response.data.communities as Community[];
                } else {
                    notification.error({
                        message: '沒有找到任何社群',
                        description: '目前沒有可用的社群資料',
                        duration: 3
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: '獲取所有社群信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },
        async getPostInfo(pid: string) {
            try {
                const response = await axios.get(`https://view-truth.zeabur.app/api/post/${pid}`);
                if (response.status === 200) {
                    this.postState.post = response.data.post;
                } else {
                    notification.error({
                        message: '貼文不存在',
                        description: '無法找到該貼文',
                        duration: 3
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: '獲取貼文信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },
        async getAllPosts(cid: string) {
            try {
                const response = await axios.get(`https://view-truth.zeabur.app/api/posts/${cid}`);
                if (response.status === 200) {
                    this.postState.posts = response.data.posts as post[];
                } else {
                    notification.error({
                        message: '沒有找到任何貼文',
                        description: '目前沒有可用的貼文資料',
                        duration: 3
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: '獲取所有貼文信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },
        //獲取該user貼文
        async getuserPosts(uid: string) {
            try {
                const response = await axios.get(`https://view-truth.zeabur.app/api/userpost/${uid}`);
                if (response.status === 200) {
                    this.postState.posts = response.data.posts as post[];
                } else {
                    notification.error({
                        message: '沒有找到任何貼文',
                        description: '目前沒有可用的貼文資料',
                        duration: 3
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: '獲取該用戶貼文信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },
        async checkFavorite(pid: string, uid: string): Promise<boolean> {
            try {
                const response = await axios.post('https://view-truth.zeabur.app/api/favorites/get/', {
                    pid,
                    uid,
                });

                console.log('獲取收藏狀態成功:', response.data);

                // 檢查 response.data 中的實際收藏狀態
                // 根據你的 API 返回數據結構來判斷
                // 例如：response.data.isFavorited 或 response.data.exists 等
                return response.data.isFavorited || response.data.exists || false;

            } catch (error: any) {
                console.error('獲取收藏狀態失敗:', error);
                return false;
            }
        }
        ,
        async checkScore(pid: string, uid: string): Promise<number> {
            try {
                const response = await axios.post('https://view-truth.zeabur.app/api/scores/get/', {
                    pid,
                    uid,
                });
                console.log('獲取評分狀態成功:', response.data);

                // 確保返回評分值，如果後端返回的數據中有 score
                return response.data.score || 0; // 如果沒有評分，返回默認值 0
            } catch (error: any) {
                console.error('獲取評分狀態失敗:', error);
                return 0; // 發生錯誤時返回默認值 0
            }
        },
        //get user favorite
        async getuserFavorites(uid: string) {
            try {
                const response = await axios.get(`https://view-truth.zeabur.app/api/userfavorites/${uid}`);
                if (response.status === 200) {
                    this.postState.favorites = response.data.favorite_posts as post[]; // 修改這裡
                } else {
                    notification.error({
                        message: '沒有找到任何收藏',
                        description: '目前沒有可用的收藏資料',
                        duration: 3
                    });
                }
            }
            catch (error: any) {
                notification.error({
                    message: '獲取該用戶收藏信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        }
        ,

        async getAllComments(pid: string) {
            try {
                const response = await axios.get(`https://view-truth.zeabur.app/api/comment/${pid}`);
                if (response.status === 200) {
                    this.postState.comments = response.data.comments as comment[];
                } else {
                    notification.error({
                        message: '沒有找到任何留言',
                        description: '目前沒有可用的留言資料',
                        duration: 3
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: '獲取所有留言信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },

        async getAllnewsies() {
            try {
                const response = await axios.get('https://view-truth.zeabur.app/api/news/all');
                if (response.status === 200) {
                    this.newstate.newsies = response.data.newsies as news[];
                } else {
                    notification.error({
                        message: '沒有找到任何內容',
                        description: '目前沒有可用的分析資料',
                        duration: 3
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: '獲取所有內容信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },
        async getnewsInfo(nid: string) {
            try {
                console.log('Fetching news with ID:', nid);
                const response = await axios.get(`https://view-truth.zeabur.app/api/news/${nid}`);
                console.log('API Response:', response);
                if (response.status === 200) {
                    console.log('News data:', response.data.news);
                    this.newstate.news = response.data.news;
                } else {
                    notification.error({
                        message: '新聞不存在',
                        description: '無法找到該新聞',
                        duration: 3
                    });
                }
            } catch (error: any) {
                console.error('API Error:', error);
                console.error('Error response:', error.response);
                notification.error({
                    message: '獲取新聞信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },
        //news的
        async getNewsAllComments(nid: string) {
            try {
                const response = await axios.get(`https://view-truth.zeabur.app/api/ncomment/${nid}`);
                if (response.status === 200) {
                    this.newstate.comments = response.data.comments as comment[];
                } else {
                    notification.error({
                        message: '沒有找到任何留言',
                        description: '目前沒有可用的留言資料',
                        duration: 3
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: '獲取所有留言信息失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
            }
        },
        setTokens(accessToken: string, refreshToken: string) {
            this.tokenState.accessToken = accessToken;
            this.tokenState.refreshToken = refreshToken;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        },

        async refreshToken() {
            try {
                const response = await axios.post('https://view-truth.zeabur.app/api/refresh', null, {
                    headers: {
                        Authorization: `Bearer ${this.tokenState.refreshToken}`
                    }
                });
                
                if (response.status === 200) {
                    this.tokenState.accessToken = response.data.access_token;
                    localStorage.setItem('accessToken', response.data.access_token);
                    return true;
                }
                return false;
            } catch (error) {
                this.logout();
                return false;
            }
        },

        setupAxiosInterceptors() {
            let isRefreshing = false;
            let failedQueue: any[] = [];

            const processQueue = (error: any, token: string | null = null) => {
                failedQueue.forEach(prom => {
                    if (error) {
                        prom.reject(error);
                    } else {
                        prom.resolve(token);
                    }
                });
                failedQueue = [];
            };

            axios.interceptors.request.use(
                config => {
                    if (this.tokenState.accessToken) {
                        config.headers.Authorization = `Bearer ${this.tokenState.accessToken}`;
                    }
                    return config;
                },
                error => {
                    return Promise.reject(error);
                }
            );

            axios.interceptors.response.use(
                response => response,
                async error => {
                    const originalRequest = error.config;

                    if (error.response?.status === 401 && !originalRequest._retry) {
                        if (isRefreshing) {
                            return new Promise((resolve, reject) => {
                                failedQueue.push({ resolve, reject });
                            })
                            .then(token => {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                                return axios(originalRequest);
                            })
                            .catch(err => Promise.reject(err));
                        }

                        originalRequest._retry = true;
                        isRefreshing = true;

                        try {
                            const refreshed = await this.refreshToken();
                            if (refreshed) {
                                processQueue(null, this.tokenState.accessToken);
                                originalRequest.headers.Authorization = `Bearer ${this.tokenState.accessToken}`;
                                return axios(originalRequest);
                            } else {
                                processQueue(new Error('Refresh failed'));
                                return Promise.reject(error);
                            }
                        } catch (refreshError) {
                            processQueue(refreshError);
                            return Promise.reject(refreshError);
                        } finally {
                            isRefreshing = false;
                        }
                    }
                    return Promise.reject(error);
                }
            );
        },

        async updateUserStatus(uid: string, status: string) {
            try {
                const response = await axios.put('https://view-truth.zeabur.app/api/user/status', {
                    uid,
                    status
                });
                
                if (response.status === 200) {
                    notification.success({
                        message: '狀態更新成功',
                        description: `用戶狀態已更新為 ${status === 'banned' ? '已封禁' : '正常'}`
                    });
                    const userIndex = this.userManagement.users.findIndex(user => user.uid === uid);
                    if (userIndex !== -1) {
                        this.userManagement.users[userIndex].status = status;
                        if (this.userManagement.selectedUser && this.userManagement.selectedUser.uid === uid) {
                            this.userManagement.selectedUser.current_status = status;
                        }
                    }
                    return true;
                }
                return false;
            } catch (error: any) {
                notification.error({
                    message: '狀態更新失敗',
                    description: error.response?.data?.error || '操作失敗，請稍後再試'
                });
                return false;
            }
        },

        async batchUpdateUserStatus(uids: string[], status: string) {
            try {
                const response = await axios.put('https://view-truth.zeabur.app/api/users/batch-status', {
                    uids,
                    status
                });
                
                if (response.status === 200) {
                    notification.success({
                        message: '批量操作成功',
                        description: `已成功更新 ${response.data.affected} 個用戶的狀態`
                    });
                    uids.forEach(uid => {
                        const userIndex = this.userManagement.users.findIndex(user => user.uid === uid);
                        if (userIndex !== -1) {
                           this.userManagement.users[userIndex].status = status;
                        }
                    });
                    return true;
                }
                return false;
            } catch (error: any) {
                notification.error({
                    message: '批量操作失敗',
                    description: error.response?.data?.error || '操作失敗，請稍後再試'
                });
                return false;
            }
        },

        async fetchUserStatistics() {
            try {
                const response = await axios.get('https://view-truth.zeabur.app/api/users/statistics');
                if (response.status === 200) {
                    return response.data;
                }
                throw new Error('Failed to fetch statistics');
            } catch (error: any) {
                notification.error({
                    message: '獲取統計數據失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
                throw error;
            }
        },

        // 獲取用戶詳情
        async getUserDetails(uid: string) {
            try {
                const response = await axios.get(`https://view-truth.zeabur.app/api/user/${uid}`);
                if (response.status === 200) {
                    this.userManagement.selectedUser = response.data.user;
                    return response.data.user;
                }
                throw new Error('Failed to fetch user details');
            } catch (error: any) {
                notification.error({
                    message: '獲取用戶詳情失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
                throw error;
            }
        },

        // 重置用戶密碼
        async resetUserPassword(uid: string) {
            try {
                const response = await axios.post(`https://view-truth.zeabur.app/api/user/reset-password`, { uid });
                if (response.status === 200) {
                    notification.success({
                        message: '密碼重置成功',
                        description: '用戶密碼已重置為預設值',
                        duration: 3
                    });
                    return true;
                }
                return false;
            } catch (error: any) {
                notification.error({
                    message: '密碼重置失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
                return false;
            }
        },

        // 更新用戶資料
        async updateUserInfo(uid: string, userData: any) {
            try {
                const response = await axios.put(`https://view-truth.zeabur.app/api/user/${uid}`, userData);
                if (response.status === 200) {
                    notification.success({
                        message: '更新成功',
                        description: '用戶資料已更新',
                        duration: 3
                    });
                    return true;
                }
                return false;
            } catch (error: any) {
                notification.error({
                    message: '更新失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
                return false;
            }
        },

        // 提交檢舉
        async submitReport(reportData: { uid: string; report_reason: string; pid?: string | null; comm_id?: string | any }) {
            try {
                const response = await axios.post('https://view-truth.zeabur.app/api/report/create', reportData);
                
                if (response.status === 201) {
                    notification.success({
                        message: '檢舉已提交',
                        description: '感謝您的回報，我們將盡快處理',
                        duration: 3
                    });
                    return true;
                }
                return false;
            } catch (error: any) {
                notification.error({
                    message: '檢舉提交失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
                return false;
            }
        },

        // 忘記密碼
        async forgotPassword(email: string) {
            try {
                const response = await axios.post(`https://view-truth.zeabur.app/api/forgot-password`, { email });
                if (response.status === 200) {
                    notification.success({
                        message: '密碼重置成功',
                        description: '臨時密碼已發送到您的郵箱',
                        duration: 3
                    });
                    return true;
                }
                return false;
            } catch (error: any) {
                notification.error({
                    message: '密碼重置失敗',
                    description: error.response?.data?.error || '請稍後再試',
                    duration: 3
                });
                return false;
            }
        }
    }
});
