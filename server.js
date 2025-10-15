const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем CSP для прокси
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Настройка прокси для goaltickets.com
const proxyOptions = {
  target: 'https://goaltickets.com',
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  pathRewrite: {
    '^/': '/' // Убираем префикс если нужно
  },
  onProxyReq: (proxyReq, req, res) => {
    // Добавляем заголовки для обхода защиты
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
    proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.5');
    proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
    proxyReq.setHeader('Connection', 'keep-alive');
    proxyReq.setHeader('Upgrade-Insecure-Requests', '1');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Удаляем заголовки безопасности
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-content-type-options'];
    delete proxyRes.headers['referrer-policy'];
    
    // Добавляем CORS заголовки
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    
    // Заменяем ссылки в HTML
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      
      proxyRes.on('end', () => {
        try {
          // Заменяем ссылки на goaltickets.com на наш домен
          const modifiedBody = body
            .replace(/https:\/\/goaltickets\.com/g, '')
            .replace(/http:\/\/goaltickets\.com/g, '')
            .replace(/\/\/goaltickets\.com/g, '')
            .replace(/goaltickets\.com/g, req.get('host'));
          
          // Проверяем, не отправлены ли уже заголовки
          if (!res.headersSent) {
            res.setHeader('Content-Length', Buffer.byteLength(modifiedBody));
            res.end(modifiedBody);
          }
        } catch (error) {
          console.error('Error processing response:', error);
          if (!res.headersSent) {
            res.end(body);
          }
        }
      });
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).send('Proxy Error: ' + err.message);
  }
};

// Применяем прокси ко всем запросам
app.use('/', createProxyMiddleware(proxyOptions));

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
