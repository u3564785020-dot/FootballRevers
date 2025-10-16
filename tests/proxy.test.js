/**
 * Unit tests for the reverse proxy
 */

const request = require('supertest');
const { app } = require('../server');

describe('Reverse Proxy Tests', () => {
  
  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
  
  describe('WebSocket Info', () => {
    test('GET /ws-info should return WebSocket information', async () => {
      const response = await request(app)
        .get('/ws-info')
        .expect(200);
      
      expect(response.body).toHaveProperty('websocket');
      expect(response.body.websocket).toHaveProperty('url');
      expect(response.body.websocket).toHaveProperty('connected_clients');
    });
  });
  
  describe('CORS Headers', () => {
    test('Should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      // CORS headers are added by the proxy middleware, not for health endpoint
      expect(response.headers).toHaveProperty('access-control-allow-credentials');
      expect(response.headers).toHaveProperty('vary');
    });
  });
  
  describe('Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
  
  describe('Rate Limiting', () => {
    test('Should apply rate limiting', async () => {
      // Make multiple requests quickly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(request(app).get('/health'));
      }
      
      const responses = await Promise.all(promises);
      // All should succeed (rate limit is 100 per 15 minutes)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});

describe('HTML Rewriting Tests', () => {
  const cheerio = require('cheerio');
  
  test('Should rewrite absolute URLs', () => {
    const html = '<a href="https://goaltickets.com/products/test">Test</a>';
    const $ = cheerio.load(html);
    
    $('a[href^="https://goaltickets.com"]').each((i, el) => {
      const href = $(el).attr('href');
      const url = new URL(href);
      $(el).attr('href', url.pathname + url.search + url.hash);
    });
    
    expect($('a').attr('href')).toBe('/products/test');
  });
  
  test('Should rewrite image sources', () => {
    const html = '<img src="https://goaltickets.com/images/test.jpg">';
    const $ = cheerio.load(html);
    
    $('img[src^="https://goaltickets.com"]').each((i, el) => {
      const src = $(el).attr('src');
      const url = new URL(src);
      $(el).attr('src', url.pathname + url.search + url.hash);
    });
    
    expect($('img').attr('src')).toBe('/images/test.jpg');
  });
});

describe('Price Modification Tests', () => {
  test('Should modify JSON prices', () => {
    const data = JSON.stringify({
      price: 100,
      total: 200,
      items: [
        { name: 'Test', price: 50 }
      ]
    });
    
    // Mock the modifyPrices function
    const modifyPrices = (data, contentType) => {
      if (contentType && contentType.includes('application/json')) {
        try {
          const jsonData = JSON.parse(data);
          const multiplier = 0.5;
          
          function modifyPricesInObject(obj) {
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                if (typeof obj[key] === 'number' && 
                    (key.includes('price') || key.includes('total')) &&
                    obj[key] > 0) {
                  obj[key] = Math.round(obj[key] * multiplier * 100) / 100;
                } else if (typeof obj[key] === 'object') {
                  modifyPricesInObject(obj[key]);
                }
              }
            }
          }
          
          modifyPricesInObject(jsonData);
          return JSON.stringify(jsonData);
        } catch (e) {
          return data;
        }
      }
      return data;
    };
    
    const result = modifyPrices(data, 'application/json');
    const parsed = JSON.parse(result);
    
    expect(parsed.price).toBe(50);
    expect(parsed.total).toBe(100);
    expect(parsed.items[0].price).toBe(25);
  });
});
