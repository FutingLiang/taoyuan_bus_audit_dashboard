// 全域變數
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let charts = {};

// API 基礎 URL
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

// 初始化應用程式
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// 初始化應用程式
async function initializeApp() {
    showLoading(true);
    try {
        await Promise.all([
            loadOverviewStats(),
            loadMonthlyStats(),
            loadGuidanceStats(),
            loadCompanyStats(),
            loadViolationStats(),
            loadRouteStats(),
            loadInspectionData(),
            loadCompanyOptions()
        ]);
        updateLastUpdateTime();
    } catch (error) {
        showError('載入資料時發生錯誤：' + error.message);
    } finally {
        showLoading(false);
    }
}

// 設定事件監聽器
function setupEventListeners() {
    // 搜尋按鈕
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    
    // 重置按鈕
    document.getElementById('resetBtn').addEventListener('click', handleReset);
    
    // 分頁按鈕
    document.getElementById('prevPage').addEventListener('click', () => changePage(currentPage - 1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(currentPage + 1));
    
    // 錯誤訊息關閉
    document.querySelector('.close-error').addEventListener('click', () => {
        document.getElementById('errorMessage').style.display = 'none';
    });
    
    // Enter 鍵搜尋
    document.getElementById('routeFilter').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// 載入總覽統計
async function loadOverviewStats() {
    try {
        const response = await fetch(`${API_BASE}/api/overview`);
        const data = await response.json();
        
        document.getElementById('totalInspections').textContent = formatNumber(data.total_inspections);
        document.getElementById('totalCompanies').textContent = formatNumber(data.total_companies);
        document.getElementById('totalRoutes').textContent = formatNumber(data.total_routes);
        document.getElementById('totalVehicles').textContent = formatNumber(data.total_vehicles);
    } catch (error) {
        console.error('載入總覽統計錯誤:', error);
        throw error;
    }
}

// 載入月份統計
async function loadMonthlyStats() {
    try {
        const response = await fetch(`${API_BASE}/api/monthly-stats`);
        const data = await response.json();
        
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        if (charts.monthly) {
            charts.monthly.destroy();
        }
        
        charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item['處理月份']),
                datasets: [{
                    label: '稽查次數',
                    data: data.map(item => item['稽查次數']),
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('載入月份統計錯誤:', error);
        throw error;
    }
}

// 載入指差統計
async function loadGuidanceStats() {
    try {
        const response = await fetch(`${API_BASE}/api/guidance-stats`);
        const data = await response.json();
        
        const ctx = document.getElementById('guidanceChart').getContext('2d');
        
        if (charts.guidance) {
            charts.guidance.destroy();
        }
        
        const colors = [
            'rgba(46, 204, 113, 0.8)',  // 綠色 - 皆有執行
            'rgba(241, 196, 15, 0.8)',  // 黃色 - 部分執行
            'rgba(231, 76, 60, 0.8)',   // 紅色 - 皆未執行
            'rgba(149, 165, 166, 0.8)'  // 灰色 - 不適用
        ];
        
        charts.guidance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item['指差狀態']),
                datasets: [{
                    data: data.map(item => item['次數']),
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('載入指差統計錯誤:', error);
        throw error;
    }
}

// 載入公司統計
async function loadCompanyStats() {
    try {
        const response = await fetch(`${API_BASE}/api/company-stats`);
        const data = await response.json();
        
        const ctx = document.getElementById('companyChart').getContext('2d');
        
        if (charts.company) {
            charts.company.destroy();
        }
        
        // 只顯示前10名
        const top10 = data.slice(0, 10);
        
        charts.company = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top10.map(item => item['公司']),
                datasets: [{
                    label: '稽查次數',
                    data: top10.map(item => item['稽查次數']),
                    backgroundColor: 'rgba(155, 89, 182, 0.8)',
                    borderColor: 'rgba(155, 89, 182, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('載入公司統計錯誤:', error);
        throw error;
    }
}

// 載入違規統計
async function loadViolationStats() {
    try {
        const response = await fetch(`${API_BASE}/api/violation-stats`);
        const data = await response.json();
        
        const ctx = document.getElementById('violationChart').getContext('2d');
        
        if (charts.violation) {
            charts.violation.destroy();
        }
        
        // 重組資料以便顯示
        const items = [...new Set(data.map(item => item['項目']))];
        const datasets = [];
        
        const statusColors = {
            '已張貼': 'rgba(46, 204, 113, 0.8)',
            '未張貼': 'rgba(231, 76, 60, 0.8)',
            '已設置': 'rgba(46, 204, 113, 0.8)',
            '未設置': 'rgba(231, 76, 60, 0.8)',
            '正常': 'rgba(46, 204, 113, 0.8)',
            '未正常': 'rgba(231, 76, 60, 0.8)'
        };
        
        const statuses = [...new Set(data.map(item => item['狀態']))];
        
        statuses.forEach(status => {
            datasets.push({
                label: status,
                data: items.map(item => {
                    const found = data.find(d => d['項目'] === item && d['狀態'] === status);
                    return found ? found['次數'] : 0;
                }),
                backgroundColor: statusColors[status] || 'rgba(149, 165, 166, 0.8)'
            });
        });
        
        charts.violation = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: items,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('載入違規統計錯誤:', error);
        throw error;
    }
}

// 載入路線統計
async function loadRouteStats() {
    try {
        const response = await fetch(`${API_BASE}/api/route-stats`);
        const data = await response.json();
        
        const ctx = document.getElementById('routeChart').getContext('2d');
        
        if (charts.route) {
            charts.route.destroy();
        }
        
        charts.route = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item['路線']),
                datasets: [
                    {
                        label: '稽查次數',
                        data: data.map(item => item['稽查次數']),
                        backgroundColor: 'rgba(52, 152, 219, 0.8)',
                        yAxisID: 'y'
                    },
                    {
                        label: '指差執行率 (%)',
                        data: data.map(item => parseFloat(item['指差執行率']).toFixed(1)),
                        backgroundColor: 'rgba(46, 204, 113, 0.8)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    } catch (error) {
        console.error('載入路線統計錯誤:', error);
        throw error;
    }
}

// 載入稽查資料
async function loadInspectionData(page = 1) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 20,
            ...currentFilters
        });
        
        const response = await fetch(`${API_BASE}/api/inspections?${params}`);
        const data = await response.json();
        
        displayInspectionTable(data.data);
        updatePagination(data.page, Math.ceil(data.total / data.limit), data.total);
        
        currentPage = data.page;
        totalPages = Math.ceil(data.total / data.limit);
    } catch (error) {
        console.error('載入稽查資料錯誤:', error);
        throw error;
    }
}

// 載入公司選項
async function loadCompanyOptions() {
    try {
        const response = await fetch(`${API_BASE}/api/company-stats`);
        const data = await response.json();
        
        const select = document.getElementById('companyFilter');
        select.innerHTML = '<option value="">全部</option>';
        
        data.forEach(company => {
            const option = document.createElement('option');
            option.value = company['公司'];
            option.textContent = company['公司'];
            select.appendChild(option);
        });
    } catch (error) {
        console.error('載入公司選項錯誤:', error);
    }
}

// 顯示稽查表格
function displayInspectionTable(data) {
    const tbody = document.getElementById('inspectionTableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" class="loading">無符合條件的資料</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row.編號 || '-'}</td>
            <td>${formatDate(row.日期)}</td>
            <td>${row.路線 || '-'}</td>
            <td>${row.公司 || '-'}</td>
            <td>${row.車牌 || '-'}</td>
            <td>${row.區域 || '-'}</td>
            <td>${formatGuidanceStatus(row['H1_指差'])}</td>
            <td>${formatBinaryStatus(row['A2_路線圖'], '已張貼', '未張貼')}</td>
            <td>${formatBinaryStatus(row['A3_意見箱'], '已設置', '未設置')}</td>
            <td>${formatBinaryStatus(row['A5_LED'], '正常', '異常')}</td>
            <td>${formatBinaryStatus(row['B1_熱忱'], '良好', '待改善')}</td>
            <td>${formatBinaryStatus(row['C1_早發'], '正常', '早發')}</td>
            <td>${formatBinaryStatus(row['C2_誤點'], '準時', '誤點')}</td>
            <td>${row.處理月份 || '-'}</td>
        </tr>
    `).join('');
}

// ... rest of the code remains the same ...
function updatePagination(currentPage, totalPages, totalRecords) {
    document.getElementById('recordCount').textContent = `共 ${formatNumber(totalRecords)} 筆記錄`;
    document.getElementById('pageInfo').textContent = `第 ${currentPage} 頁，共 ${totalPages} 頁`;
    
    // 更新分頁按鈕
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
    
    // 更新頁碼
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => changePage(i));
        pageNumbers.appendChild(pageBtn);
    }
}

// 處理搜尋
function handleSearch() {
    currentFilters = {
        company: document.getElementById('companyFilter').value,
        month: document.getElementById('monthFilter').value,
        route: document.getElementById('routeFilter').value
    };
    
    // 移除空值
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) {
            delete currentFilters[key];
        }
    });
    
    currentPage = 1;
    loadInspectionData(1);
}

// 處理重置
function handleReset() {
    document.getElementById('companyFilter').value = '';
    document.getElementById('monthFilter').value = '';
    document.getElementById('routeFilter').value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadInspectionData(1);
}

// 切換頁面
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    loadInspectionData(page);
}

// 格式化數字
function formatNumber(num) {
    return new Intl.NumberFormat('zh-TW').format(num);
}

// 格式化日期
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW');
}

// 格式化指差狀態
function formatGuidanceStatus(status) {
    const statusMap = {
        1: '<span class="status-good">皆有執行</span>',
        2: '<span class="status-warning">部分執行</span>',
        3: '<span class="status-bad">皆未執行</span>',
        9: '<span class="status-warning">不適用</span>'
    };
    return statusMap[status] || '-';
}

// 格式化二元狀態
function formatBinaryStatus(value, goodText, badText) {
    if (value === null || value === undefined) return '-';
    if (value === 0) return `<span class="status-bad">${badText}</span>`;
    return `<span class="status-good">${goodText}</span>`;
}

// 顯示載入指示器
function showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    indicator.style.display = show ? 'flex' : 'none';
}

// 顯示錯誤訊息
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = errorDiv.querySelector('.error-text');
    errorText.textContent = message;
    errorDiv.style.display = 'flex';
    
    // 5秒後自動隱藏
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// 更新最後更新時間
function updateLastUpdateTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-TW');
    document.getElementById('lastUpdate').textContent = timeStr;
}
