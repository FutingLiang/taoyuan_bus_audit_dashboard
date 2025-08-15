const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 資料庫連線設定
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 's8304021',
  port: 5432,
});

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 設定正確的字符編碼
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// 測試資料庫連線
pool.connect((err, client, release) => {
  if (err) {
    console.error('資料庫連線錯誤:', err);
  } else {
    console.log('✅ 資料庫連線成功');
    release();
  }
});

// API 路由

// 1. 獲取總覽統計
app.get('/api/overview', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_inspections,
        COUNT(DISTINCT "公司") as total_companies,
        COUNT(DISTINCT "路線") as total_routes,
        COUNT(DISTINCT "車牌") as total_vehicles
      FROM taoyuan_bus_inspection_2025_01_07
    `;
    const result = await pool.query(query);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('獲取總覽統計錯誤:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 2. 指差執行統計
app.get('/api/guidance-stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        "H1_指差",
        CASE 
          WHEN "H1_指差" = 1 THEN '皆有執行'
          WHEN "H1_指差" = 2 THEN '部分執行'
          WHEN "H1_指差" = 3 THEN '皆未執行'
          WHEN "H1_指差" = 9 THEN '不適用'
          ELSE '未記錄'
        END as 指差狀態,
        COUNT(*) as 次數
      FROM taoyuan_bus_inspection_2025_01_07
      WHERE "H1_指差" IS NOT NULL
      GROUP BY "H1_指差"
      ORDER BY "H1_指差"
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('獲取指差統計錯誤:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 3. 各客運公司稽查次數
app.get('/api/company-stats', async (req, res) => {
  try {
    const query = `
      SELECT "公司", COUNT(*) as 稽查次數
      FROM taoyuan_bus_inspection_2025_01_07
      WHERE "公司" IS NOT NULL
      GROUP BY "公司"
      ORDER BY 稽查次數 DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('獲取公司統計錯誤:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 4. 月份稽查統計
app.get('/api/monthly-stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        "處理月份",
        COUNT(*) as 稽查次數
      FROM taoyuan_bus_inspection_2025_01_07
      WHERE "處理月份" IS NOT NULL
      GROUP BY "處理月份"
      ORDER BY 
        CASE "處理月份"
          WHEN '1月' THEN 1
          WHEN '2月' THEN 2
          WHEN '3月' THEN 3
          WHEN '4月' THEN 4
          WHEN '5月' THEN 5
          WHEN '6月' THEN 6
          WHEN '7月' THEN 7
        END
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('獲取月份統計錯誤:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 5. 違規項目統計
app.get('/api/violation-stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        '路線圖' as 項目,
        CASE WHEN "A2_路線圖" = 0 THEN '未張貼' ELSE '已張貼' END as 狀態,
        COUNT(*) as 次數
      FROM taoyuan_bus_inspection_2025_01_07
      WHERE "A2_路線圖" IS NOT NULL
      GROUP BY "A2_路線圖"
      
      UNION ALL
      
      SELECT 
        '意見箱' as 項目,
        CASE WHEN "A3_意見箱" = 0 THEN '未設置' ELSE '已設置' END as 狀態,
        COUNT(*) as 次數
      FROM taoyuan_bus_inspection_2025_01_07
      WHERE "A3_意見箱" IS NOT NULL
      GROUP BY "A3_意見箱"
      
      UNION ALL
      
      SELECT 
        'LED顯示器' as 項目,
        CASE WHEN "A5_LED" = 0 THEN '未正常' ELSE '正常' END as 狀態,
        COUNT(*) as 次數
      FROM taoyuan_bus_inspection_2025_01_07
      WHERE "A5_LED" IS NOT NULL
      GROUP BY "A5_LED"
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('獲取違規統計錯誤:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 6. 詳細稽查記錄
app.get('/api/inspections', async (req, res) => {
  try {
    const { page = 1, limit = 20, company, month, route } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (company) {
      paramCount++;
      whereClause += ` AND "公司" = $${paramCount}`;
      params.push(company);
    }
    
    if (month) {
      paramCount++;
      whereClause += ` AND "處理月份" = $${paramCount}`;
      params.push(month);
    }
    
    if (route) {
      paramCount++;
      whereClause += ` AND "路線" ILIKE $${paramCount}`;
      params.push(`%${route}%`);
    }
    
    const query = `
      SELECT 
        "編號", "日期", "路線", "公司", "車牌", "區域",
        "H1_指差", "A2_路線圖", "A3_意見箱", "A5_LED",
        "B1_熱忱", "C1_早發", "C2_誤點", "處理月份"
      FROM taoyuan_bus_inspection_2025_01_07
      ${whereClause}
      ORDER BY "日期" DESC, "編號"
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // 獲取總數
    const countQuery = `
      SELECT COUNT(*) as total
      FROM taoyuan_bus_inspection_2025_01_07
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    
    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('獲取稽查記錄錯誤:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 7. 路線統計
app.get('/api/route-stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        "路線",
        COUNT(*) as 稽查次數,
        AVG(CASE WHEN "H1_指差" = 1 THEN 1.0 ELSE 0.0 END) * 100 as 指差執行率
      FROM taoyuan_bus_inspection_2025_01_07
      WHERE "路線" IS NOT NULL AND "H1_指差" IS NOT NULL
      GROUP BY "路線"
      HAVING COUNT(*) >= 5
      ORDER BY 稽查次數 DESC
      LIMIT 20
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('獲取路線統計錯誤:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 提供主頁面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 伺服器運行在 http://localhost:${PORT}`);
});

module.exports = app;
