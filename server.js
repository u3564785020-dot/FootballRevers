const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

// Кэширование статических файлов
app.use(express.static('index_files', {
  maxAge: '1d',
  etag: false
}));

// Логирование только важных запросов
app.use((req, res, next) => {
  if (!req.url.includes('/cdn/') && !req.url.includes('/api/')) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// Обработка статических файлов локально
app.get('/index_files/*', (req, res, next) => {
  // Если файл есть локально, отдаем его
  next();
});

// Обработка POST запросов (возвращаем 200 для избежания ошибок)
app.post('/api/*', (req, res) => {
  res.status(200).json({ success: true });
});

app.post('/cart/*', (req, res) => {
  res.status(200).json({ success: true });
});

app.post('/.well-known/*', (req, res) => {
  res.status(200).json({ success: true });
});

// Настройка прокси только для HTML страниц
const proxyOptions = {
  target: 'https://goaltickets.com',
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  timeout: 10000, // 10 секунд таймаут
  proxyTimeout: 10000,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
    proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.5');
    proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
    proxyReq.setHeader('Connection', 'keep-alive');
    proxyReq.setHeader('Cache-Control', 'no-cache');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Удаляем проблемные заголовки
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-content-type-options'];
    delete proxyRes.headers['referrer-policy'];
    
    // Добавляем кэширование
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      proxyRes.headers['Cache-Control'] = 'public, max-age=300'; // 5 минут кэш
    }
    
    // Добавляем CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Service temporarily unavailable');
    }
  }
};

// Применяем прокси только к корневой странице
app.get('/', createProxyMiddleware(proxyOptions));

// Для всех остальных GET запросов - прокси к оригинальному сайту
app.get('*', createProxyMiddleware({
  target: 'https://goaltickets.com',
  changeOrigin: true,
  secure: true,
  timeout: 5000,
  onError: (err, req, res) => {
    if (!res.headersSent) {
      res.status(404).send('Not found');
    }
  }
}));

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📡 Proxying requests to: https://goaltickets.com`);
  console.log(`🌐 Access your proxy at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
