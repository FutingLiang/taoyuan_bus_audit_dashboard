# 桃園公車稽查儀表板

一個基於 Node.js 和 PostgreSQL 的現代化公車稽查資料視覺化儀表板。

## 功能特色

- 📊 **總覽統計** - 顯示稽查次數、公司數、路線數、車輛數
- 📈 **月份統計** - 各月份稽查次數趨勢圖
- 🎯 **指差執行統計** - 司機指差執行情況分析
- 🏢 **客運公司統計** - 各公司稽查次數排行
- ⚠️ **違規項目統計** - 路線圖、意見箱、LED等設備檢查結果
- 🛣️ **路線統計** - 熱門路線稽查次數與指差執行率
- 🔍 **詳細記錄查詢** - 支援多條件篩選和分頁瀏覽
- 📱 **響應式設計** - 支援桌面和行動裝置

## 技術架構

### 後端
- **Node.js** - 伺服器運行環境
- **Express.js** - Web 框架
- **PostgreSQL** - 資料庫
- **pg** - PostgreSQL 客戶端

### 前端
- **HTML5** - 頁面結構
- **CSS3** - 樣式設計（含響應式布局）
- **JavaScript (ES6+)** - 互動功能
- **Chart.js** - 圖表視覺化

## 安裝與設定

### 1. 環境需求
- Node.js 16.0 或更高版本
- PostgreSQL 12.0 或更高版本

### 2. 安裝相依套件
```bash
cd taoyuan-bus-dashboard
npm install
```

### 3. 資料庫設定
確保 PostgreSQL 服務正在運行，並且已經執行過資料匯入腳本，建立了 `taoyuan_bus_inspection_2025_01_07` 資料表。

### 4. 環境變數設定
檢查 `.env` 檔案中的資料庫連線設定：
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=```

### 5. 啟動應用程式
```bash
# 開發模式（需安裝 nodemon）
npm run dev

# 或一般模式
npm start
```

### 6. 瀏覽器訪問
開啟瀏覽器，前往 `http://localhost:3000`

## API 端點

| 端點 | 方法 | 描述 |
|------|------|------|
| `/api/overview` | GET | 獲取總覽統計 |
| `/api/guidance-stats` | GET | 指差執行統計 |
| `/api/company-stats` | GET | 客運公司統計 |
| `/api/monthly-stats` | GET | 月份統計 |
| `/api/violation-stats` | GET | 違規項目統計 |
| `/api/route-stats` | GET | 路線統計 |
| `/api/inspections` | GET | 詳細稽查記錄（支援分頁和篩選） |

## 資料表結構

主要使用 `taoyuan_bus_inspection_2025_01_07` 資料表，包含以下主要欄位：

- `編號` - 稽查記錄編號
- `日期` - 稽查日期
- `路線` - 公車路線
- `公司` - 客運公司
- `車牌` - 車輛車牌號碼
- `區域` - 稽查區域
- `h1_指差` - 指差執行狀況
- `a2_路線圖` - 路線圖張貼狀況
- `a3_意見箱` - 意見箱設置狀況
- `a5_led` - LED顯示器狀況
- `處理月份` - 資料處理月份

## 使用說明

### 儀表板總覽
- 頁面頂部顯示關鍵統計數據
- 中間區域展示各種統計圖表
- 底部提供詳細記錄查詢功能

### 篩選功能
- **客運公司篩選** - 選擇特定客運公司
- **月份篩選** - 選擇特定月份
- **路線篩選** - 輸入路線號碼進行模糊搜尋

### 圖表說明
- **月份統計** - 長條圖顯示各月稽查次數
- **指差執行統計** - 甜甜圈圖顯示執行狀況分布
- **客運公司統計** - 水平長條圖顯示前10名公司
- **違規項目統計** - 堆疊長條圖顯示各項目檢查結果
- **路線統計** - 雙軸長條圖顯示稽查次數與執行率

## 故障排除

### 常見問題

1. **無法連接資料庫**
   - 檢查 PostgreSQL 服務是否運行
   - 確認 `.env` 檔案中的連線參數
   - 檢查防火牆設定

2. **資料無法載入**
   - 確認資料表 `taoyuan_bus_inspection_2025_01_07` 是否存在
   - 檢查資料表中是否有資料
   - 查看伺服器控制台錯誤訊息

3. **圖表無法顯示**
   - 檢查瀏覽器控制台是否有 JavaScript 錯誤
   - 確認 Chart.js 是否正確載入
   - 檢查 API 回應是否正常

## 開發說明

### 新增 API 端點
在 `server.js` 中新增路由：
```javascript
app.get('/api/new-endpoint', async (req, res) => {
  try {
    // 資料庫查詢邏輯
    const result = await pool.query('SELECT ...');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '錯誤訊息' });
  }
});
```

### 新增前端功能
1. 在 `script.js` 中新增資料載入函數
2. 在 `index.html` 中新增 UI 元素
3. 在 `styles.css` 中新增樣式

## 授權

MIT License

## 聯絡資訊

如有問題或建議，請聯繫開發團隊。
