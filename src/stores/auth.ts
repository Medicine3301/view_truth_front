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
    Pending: string
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
                const response = await axios.post('https://realeye.zeabur.app/api/login', {
                    username,
                    password
                }, { withCredentials: true });  // 啟用 credentials

                if (response.status === 200) {
                    this.userState.user = response.data.user;
                    this.userState.isAuthenticated = true;
                    
                    // 儲存 token 並設置 axios 預設標頭
                    const accessToken = response.data.access_token;
                    const refreshToken = response.data.refresh_token;
                    
                    console.log('登入成功: 取得 access_token', accessToken.substring(0, 10) + '...');
                    
                    // 確保 tokens 格式正確
                    this.setTokens(accessToken, refreshToken);
                    
                    // 設置全局 axios 標頭
                    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    
                    notification.success({
                        message: '登入成功',
                        description: '歡迎回來！',
                        duration: 3
                    });
                    return true;
                }
                return false;
            } catch (error: any) {
                console.error('登入失敗:', error);
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
                const response = await axios.post('https://realeye.zeabur.app/api/register', userData);

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
            console.log('登出: 清除認證狀態');
            
            // 清除狀態
            this.userState.user = null;
            this.userState.isAuthenticated = false;
            this.tokenState.accessToken = null;
            this.tokenState.refreshToken = null;
            
            // 清除本地儲存
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('token'); // 移除舊版 token
            
            // 清除 axios 標頭
            delete axios.defaults.headers.common['Authorization'];
            
            // 通知用戶
            notification.info({
                message: '已登出',
                description: '您已成功登出系統',
                duration: 3
            });
            
            console.log('登出: 認證狀態已清除');
        },

        async logoutWithRequest() {
            try {
                // 從 localStorage 或 store 中獲取 token
                const accessToken = this.tokenState.accessToken || localStorage.getItem('accessToken');
                
                if (!accessToken) {
                    console.log('登出: 沒有找到有效的 accessToken');
                    this.logout();
                    return true;
                }

                // 向後端發送登出請求
                try {
                    const response = await axios.post('https://realeye.zeabur.app/api/logout', null, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        },
                        withCredentials: true
                    });
                    
                    if (response.status === 200) {
                        console.log('登出: 後端登出成功');
                    } else {
                        console.warn('登出: 後端響應狀態碼不是 200', response.status);
                    }
                } catch (error: any) {
                    // 即使後端請求失敗，仍然繼續本地登出
                    console.error('後端登出請求失敗:', error);
                    const status = error.response?.status;
                    
                    if (status) {
                        console.warn(`登出: HTTP錯誤 ${status}`);
                    }
                }

                // 無論後端請求成功與否，都執行本地登出
                this.logout();
                return true;
            } catch (error) {
                console.error('登出過程中發生錯誤:', error);
                // 執行本地登出作為後備方案
                this.logout();
                return true;
            }
        },

        async checkAuth() {
            // 從 localStorage 和 store 中獲取 token
            const accessToken = this.tokenState.accessToken || localStorage.getItem('accessToken');
            if (!accessToken) {
                console.log('checkAuth: 沒有找到有效的 accessToken');
                this.logout();
                return false;
            }

            // 設置 axios 預設標頭
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            try {
                // 確保明確傳遞 Authorization 頭部
                const response = await axios.get('https://realeye.zeabur.app/api/verify', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    withCredentials: true  // 啟用 credentials
                });

                if (response.status === 200) {
                    this.userState.user = response.data.user;
                    this.userState.isAuthenticated = true;
                    console.log('checkAuth: 認證成功');
                    return true;
                } else {
                    console.warn('checkAuth: 認證響應不為 200，清除所有 token');
                    this.logout();
                    return false;
                }
            } catch (error: any) {
                // 記錄詳細錯誤信息
                console.error('驗證 token 失敗:', error);
                const status = error.response?.status;
                const data = error.response?.data;
                
                if (status) {
                    console.warn(`checkAuth: HTTP錯誤 ${status}，清除所有 token`, data);
                }
                
                // 不論是什麼錯誤，直接清除所有 token 並登出
                this.logout();
                return false;
            }
        },

        // 驗證但不嘗試刷新 token（避免無限循環）
        async verifyWithoutRefresh() {
            try {
                const accessToken = this.tokenState.accessToken || localStorage.getItem('accessToken');
                if (!accessToken) {
                    console.warn('verifyWithoutRefresh: 沒有找到有效的 accessToken');
                    this.logout();
                    return false;
                }
                
                console.log('verifyWithoutRefresh: 使用新 token 驗證');
                
                const response = await axios.get('https://realeye.zeabur.app/api/verify', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    withCredentials: true
                });
                
                if (response.status === 200) {
                    this.userState.user = response.data.user;
                    this.userState.isAuthenticated = true;
                    console.log('verifyWithoutRefresh: 驗證成功');
                    return true;
                } else {
                    console.warn('verifyWithoutRefresh: 驗證響應不為 200');
                }
            } catch (error: any) {
                console.error('二次驗證失敗:', error);
                const status = error.response?.status;
                const data = error.response?.data;
                
                if (status) {
                    console.warn(`verifyWithoutRefresh: HTTP錯誤 ${status}`, data);
                }
                
                this.logout();
            }
            return false;
        },

        //獲取用戶列表(後台)
        async fetchUsers(params: Record<string, any>) {
            this.userManagement.loading = true;
            try {
                const response = await axios.get('https://realeye.zeabur.app/api/users', { params });
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
                const response = await axios.get(`https://realeye.zeabur.app/api/user/${uid}`);
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
                const response = await axios.get(`https://realeye.zeabur.app/api/community/${cid}`);
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
                const response = await axios.get('https://realeye.zeabur.app/api/community/all');
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
                const response = await axios.get(`https://realeye.zeabur.app/api/post/${pid}`);
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
                const response = await axios.get(`https://realeye.zeabur.app/api/posts/${cid}`);
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
                const response = await axios.get(`https://realeye.zeabur.app/api/userpost/${uid}`);
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
                const response = await axios.post('https://realeye.zeabur.app/api/favorites/get/', {
                    pid,
                    uid,
                });

                console.log('獲取收藏狀態成功 (checkFavorite API response):', response.data); // 更明確的日誌

                // 檢查各種可能的布爾指標
                if (response.data && typeof response.data.isFavorited === 'boolean') {
                    return response.data.isFavorited;
                }
                if (response.data && typeof response.data.favorited === 'boolean') {
                    return response.data.favorited;
                }
                if (response.data && typeof response.data.exists === 'boolean') {
                    return response.data.exists;
                }
                // 新增對 snake_case 版本的檢查，因為這很常見
                if (response.data && typeof response.data.is_favorited === 'boolean') {
                    return response.data.is_favorited;
                }

                console.warn('checkFavorite: 無法從已知欄位 (isFavorited, favorited, exists, is_favorited) 判斷收藏狀態。預設為 false。回應資料:', response.data);
                return false; // 如果找不到明確的 true 指標，則預設為 false

            } catch (error: any) {
                // 如果有錯誤回應，則記錄下來
                if (error.response) {
                    console.error('獲取收藏狀態失敗 (checkFavorite API error):', error.response.status, error.response.data);
                } else {
                    console.error('獲取收藏狀態失敗 (checkFavorite network/other error):', error.message);
                }
                return false; // 發生錯誤時，假設未收藏
            }
        },
        async checkScore(pid: string, uid: string): Promise<number> {
            try {
                const response = await axios.post('https://realeye.zeabur.app/api/scores/get/', {
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
                const response = await axios.get(`https://realeye.zeabur.app/api/userfavorites/${uid}`);
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
                const response = await axios.get(`https://realeye.zeabur.app/api/comment/${pid}`);
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
                const response = await axios.get('https://realeye.zeabur.app/api/news/all');
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
                const response = await axios.get(`https://realeye.zeabur.app/api/news/${nid}`);
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
                const response = await axios.get(`https://realeye.zeabur.app/api/ncomment/${nid}`);
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
            // 先檢查 token 有效性
            if (!accessToken || typeof accessToken !== 'string') {
                console.error('嘗試設置無效的 accessToken:', accessToken);
                return;
            }
            
            if (!refreshToken || typeof refreshToken !== 'string') {
                console.error('嘗試設置無效的 refreshToken:', refreshToken);
                return;
            }
            
            console.log('設置 tokens, accessToken:', accessToken.substring(0, 10) + '...');
            
            // 更新 store
            this.tokenState.accessToken = accessToken;
            this.tokenState.refreshToken = refreshToken;
            
            // 更新 localStorage
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        },

        async refreshToken() {
            try {
                const refreshToken = this.tokenState.refreshToken || localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    console.error('無法刷新 token: refresh token 不存在');
                    this.logout();
                    // 顯示友好提示訊息
                    notification.info({
                        message: '登入已過期',
                        description: '請重新登入以繼續使用',
                        duration: 3
                    });
                    return false;
                }
                
                console.log('refreshToken: 嘗試刷新 token');
                
                // 嘗試兩種不同的方式發送 refresh token
                try {
                    // 方式一：在 header 中傳遞
                    console.log('refreshToken: 使用 header 方式');
                    const response = await axios.post('https://realeye.zeabur.app/api/refresh', null, {
                        headers: {
                            'Authorization': `Bearer ${refreshToken}`,
                            'Content-Type': 'application/json'
                        },
                        withCredentials: true  // 啟用 credentials
                    });
                    
                    if (response.status === 200) {
                        const newAccessToken = response.data.access_token;
                        const newRefreshToken = response.data.refresh_token || refreshToken;
                        
                        console.log('refreshToken: 成功獲取新 token');
                        
                        // 更新 tokens 和 axios 標頭
                        this.setTokens(newAccessToken, newRefreshToken);
                        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                        
                        return true;
                    }
                    console.warn('refreshToken: 響應成功但狀態碼不是 200', response.status);
                } catch (headerError) {
                    console.error('使用 header 方式刷新 token 失敗，嘗試請求體方式:', headerError);
                    
                    // 方式二：在請求體中傳遞
                    try {
                        console.log('refreshToken: 使用請求體方式');
                        const bodyResponse = await axios.post('https://realeye.zeabur.app/api/refresh', 
                            { refresh_token: refreshToken },
                            {
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                withCredentials: true
                            }
                        );
                        
                        if (bodyResponse.status === 200) {
                            const newAccessToken = bodyResponse.data.access_token;
                            const newRefreshToken = bodyResponse.data.refresh_token || refreshToken;
                            
                            console.log('refreshToken: 使用請求體方式成功獲取新 token');
                            
                            // 更新 tokens 和 axios 標頭
                            this.setTokens(newAccessToken, newRefreshToken);
                            axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                            
                            return true;
                        }
                        console.warn('refreshToken: 請求體方式響應成功但狀態碼不是 200', bodyResponse.status);
                    } catch (bodyError: any) {
                        console.error('使用請求體方式刷新 token 也失敗:', bodyError);
                        
                        // 記錄詳細錯誤信息
                        const status = bodyError.response?.status;
                        const data = bodyError.response?.data;
                        
                        if (status) {
                            console.warn(`refreshToken: HTTP錯誤 ${status}`, data);
                            
                            // 如果是 401 錯誤，表示 refresh token 也過期了
                            if (status === 401) {
                                console.warn('refreshToken: Refresh token 已過期，需要重新登入');
                                this.logout();
                                // 顯示友好提示訊息而不是錯誤
                                notification.info({
                                    message: '登入已過期',
                                    description: '您的登入已過期，請重新登入以繼續使用',
                                    duration: 5
                                });
                                
                                // 可以選擇重定向到登入頁面
                                if (window.location.pathname !== '/login') {
                                    setTimeout(() => {
                                        window.location.href = '/login';
                                    }, 1000);
                                }
                                
                                return false;
                            }
                        }
                        
                        throw bodyError; // 其他類型的錯誤，拋出錯誤
                    }
                }
                
                console.warn('refreshToken: 所有刷新嘗試失敗');
                this.logout();
                // 顯示友好提示訊息
                notification.info({
                    message: '登入已過期',
                    description: '請重新登入以繼續使用',
                    duration: 3
                });
                
                // 可以選擇重定向到登入頁面
                if (window.location.pathname !== '/login') {
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);
                }
                
                return false;
            } catch (error) {
                console.error('刷新 token 失敗:', error);
                this.logout();
                // 顯示友好提示訊息而不是錯誤
                notification.info({
                    message: '登入已過期',
                    description: '請重新登入以繼續使用',
                    duration: 3
                });
                
                // 可以選擇重定向到登入頁面
                if (window.location.pathname !== '/login') {
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);
                }
                
                return false;
            }
        },

        setupAxiosInterceptors() {
            // 避免重複添加攔截器
            axios.interceptors.request.eject(0);
            axios.interceptors.response.eject(0);
            
            let isRefreshing = false;
            let failedQueue: any[] = [];
            
            // 標記是否已經顯示了登入過期的提示
            let hasShownExpiredNotification = false;

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
                    // 每次請求都從 localStorage 或 store 中獲取最新的 token
                    const token = this.tokenState.accessToken || localStorage.getItem('accessToken');
                    if (token) {
                        // 確保標頭格式一致
                        config.headers.Authorization = `Bearer ${token}`;
                        
                        // 添加日誌以便調試
                        const isRefreshEndpoint = config.url?.includes('/refresh');
                        const isVerifyEndpoint = config.url?.includes('/verify');
                        
                        if (isRefreshEndpoint || isVerifyEndpoint) {
                            console.log(`發送請求到 ${config.url}, Authorization:`, 
                                `Bearer ${token.substring(0, 10)}...`);
                        }
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
                    
                    // 處理空的錯誤響應
                    if (!error.response) {
                        return Promise.reject(error);
                    }

                    // 處理 401 未授權錯誤
                    if (error.response.status === 401 && !originalRequest._retry) {
                        // 避免刷新頁面時若token已過期導致重複顯示通知
                        const isInitialAuthRequest = originalRequest.url.includes('/verify');
                        
                        // 如果是 refresh token 請求返回 401，表示 refresh token 已過期
                        if (originalRequest.url.includes('/refresh')) {
                            if (!hasShownExpiredNotification) {
                                hasShownExpiredNotification = true;
                                console.warn('Token 刷新失敗: refresh token 已過期');
                                
                                // 登出並顯示友好提示
                                this.logout();
                                notification.info({
                                    message: '登入已過期',
                                    description: '您的登入階段已結束，請重新登入以繼續使用',
                                    duration: 5
                                });
                                
                                // 可以選擇重定向到登入頁面
                                if (window.location.pathname !== '/login') {
                                    setTimeout(() => {
                                        window.location.href = '/login';
                                    }, 1000);
                                }
                            }
                            return Promise.reject(error);
                        }
                        
                        // 如果已經在刷新過程中，將請求加入隊列
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
                            isRefreshing = false;
                            
                            if (refreshed) {
                                // 刷新成功，更新原始請求的標頭
                                processQueue(null, this.tokenState.accessToken);
                                originalRequest.headers.Authorization = `Bearer ${this.tokenState.accessToken}`;
                                return axios(originalRequest);
                            } else {
                                // 刷新失敗，處理隊列並拒絕
                                processQueue(new Error('刷新 token 失敗'));
                                
                                // 前面的 refreshToken 方法已經處理了登出和通知，這裡不需要重複
                                return Promise.reject(error);
                            }
                        } catch (refreshError) {
                            // 刷新發生錯誤，處理隊列並拒絕
                            isRefreshing = false;
                            processQueue(refreshError);
                            
                            // 不要在初始認證請求時顯示錯誤
                            if (!isInitialAuthRequest && !hasShownExpiredNotification) {
                                hasShownExpiredNotification = true;
                                this.logout();
                                notification.info({
                                    message: '登入已過期',
                                    description: '請重新登入以繼續使用',
                                    duration: 4
                                });
                                
                                // 可以選擇重定向到登入頁面
                                if (window.location.pathname !== '/login') {
                                    setTimeout(() => {
                                        window.location.href = '/login';
                                    }, 1000);
                                }
                            }
                            
                            return Promise.reject(refreshError);
                        }
                    } else if (error.response.status === 403) {
                        // 處理權限不足錯誤
                        notification.error({
                            message: '權限不足',
                            description: '您沒有執行此操作的權限',
                            duration: 3
                        });
                    }
                    
                    // 其他類型的錯誤
                    return Promise.reject(error);
                }
            );
        },

        async updateUserStatus(uid: string, status: string) {
            try {
                const response = await axios.put('https://realeye.zeabur.app/api/user/status', {
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
                const response = await axios.put('https://realeye.zeabur.app/api/users/batch-status', {
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
                const response = await axios.get('https://realeye.zeabur.app/api/users/statistics');
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
                const response = await axios.get(`https://realeye.zeabur.app/api/user/${uid}`);
                console.log('API 回傳的用戶詳情:', response.data);
                if (response.status === 200) {
                    // 保留原有的 selectedUser 中的 status
                    const currentStatus = this.userManagement.selectedUser?.status;
                    const userData = response.data.user;
                    this.userManagement.selectedUser = {
                        ...userData,
                        status: currentStatus || userData.status || 'normal' // 優先使用現有狀態
                    };
                    return response.data.user;
                }
                throw new Error('Failed to fetch user details');
            } catch (error: any) {
                console.error('獲取用戶詳情錯誤:', error.response || error);
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
                const response = await axios.post(`https://realeye.zeabur.app/api/user/reset-password`, { uid });
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
                const response = await axios.put(`https://realeye.zeabur.app/api/user/${uid}`, userData);
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
                const response = await axios.post('https://realeye.zeabur.app/api/report/create', reportData);
                
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
                const response = await axios.post(`https://realeye.zeabur.app/api/forgot-password`, { email });
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
        },

        // 初始化認證狀態
        async initAuth() {
            // 從 localStorage 或 store 中獲取 token
            const accessToken = this.tokenState.accessToken || localStorage.getItem('accessToken');
            
            // 如果沒有 token，直接返回
            if (!accessToken) {
                console.log('initAuth: 沒有找到 token，不需要驗證');
                return false;
            }
            
            // 簡單驗證 token 格式是否合理
            try {
                // JWT 格式為 xxx.yyy.zzz
                if (!accessToken.includes('.') || accessToken.split('.').length !== 3) {
                    console.warn('initAuth: token 格式不正確，清除無效 token');
                    this.logout();
                    return false;
                }
                
                // 設置 axios 預設標頭
                axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                console.log('初始化認證: 設置 Authorization 頭部', `Bearer ${accessToken.substring(0, 10)}...`);
                
                // 設置攔截器
                this.setupAxiosInterceptors();
                
                // 嘗試靜默驗證 token 有效性
                try {
                    return await this.checkAuth();
                } catch (error) {
                    // 驗證失敗但不顯示錯誤，只是確保登出
                    console.warn('initAuth: token 驗證失敗，清除無效 token');
                    this.logout();
                    return false;
                }
            } catch (error) {
                console.error('初始化認證失敗:', error);
                this.logout();
                return false;
            }
        }
    }
});
