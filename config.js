/**
 * Configuration file for the reverse proxy
 */

module.exports = {
  // Target configuration
  target: {
    host: 'goaltickets.com',
    protocol: 'https',
    port: 443
  },
  
  // Proxy configuration
  proxy: {
    domain: process.env.PROXY_DOMAIN || 'footballrevers-production.up.railway.app',
    port: process.env.PORT || 3000,
    protocol: process.env.PROTOCOL || 'https'
  },
  
  // Price modifier configuration (for staging/testing only)
  priceModifier: {
    enabled: process.env.ENABLE_PRICE_MODIFIER === 'true',
    multiplier: parseFloat(process.env.PRICE_MULTIPLIER) || 0.5,
    label: process.env.PRICE_LABEL || 'ТЕСТОВАЯ ЦЕНА (не для реальных покупок)',
    environment: process.env.NODE_ENV || 'production'
  },
  
  // Caching configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 120
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // WebSocket configuration
  websocket: {
    path: '/ws',
    pingInterval: 30000,
    pingTimeout: 5000,
    maxConnections: 1000
  },
  
  // Security configuration
  security: {
    csp: {
      enabled: true,
      reportUri: process.env.CSP_REPORT_URI || null
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type', 'Authorization', 'X-Requested-With', 
        'Accept', 'Origin', 'User-Agent', 'Cache-Control', 
        'Pragma', 'X-CSRF-Token'
      ]
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    enableMorgan: process.env.ENABLE_MORGAN !== 'false'
  },
  
  // Redis configuration (for future scaling)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true'
  }
};
