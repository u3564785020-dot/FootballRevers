const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const VERSION = '5.0.0'; // Финальная версия

// Middleware
app.use(express.static('.', {
  maxAge: '1d',
  etag: false
}));

// CORS для всех запросов
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Proxy-Version', VERSION);
  next();
});

// Логирование
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Главная страница - наш HTML с iframe
app.get('/', (req, res) => {
  console.log('🏠 Serving main page with iframe proxy');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Все остальные запросы - редирект на оригинальный сайт
app.get('*', (req, res) => {
  console.log(`🔄 Redirecting ${req.url} to original site`);
  res.redirect(`https://goaltickets.com${req.url}`);
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SIMPLE PROXY v${VERSION} running on port ${PORT}`);
  console.log(`🌐 Access your proxy at: http://localhost:${PORT}`);
  console.log(`📡 All requests redirect to: https://goaltickets.com`);
});