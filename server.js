const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = '9.0.0'; // CUSTOM CART SOLUTION

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store cart items in memory (in production use Redis)
let cartItems = [];

// Custom cart page
app.get('/cart', (req, res) => {
  const cartHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cart - GoalTickets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; }
        .item-info h3 { margin: 0; color: #333; }
        .item-price { font-size: 18px; font-weight: bold; color: #e74c3c; }
        .original-price { text-decoration: line-through; color: #999; font-size: 14px; }
        .discount-label { background: #e74c3c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .checkout-btn { background: #e74c3c; color: white; border: none; padding: 15px 30px; font-size: 18px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 20px; }
        .checkout-btn:hover { background: #c0392b; }
        .empty-cart { text-align: center; padding: 40px; color: #666; }
        .total { font-size: 24px; font-weight: bold; text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛒 Your Cart</h1>
        <div id="cart-items">
            ${cartItems.length === 0 ? 
                '<div class="empty-cart">Your cart is empty</div>' : 
                cartItems.map(item => `
                    <div class="cart-item">
                        <div class="item-info">
                            <h3>${item.title}</h3>
                            <div class="item-price">
                                $${item.discountedPrice.toFixed(2)}
                                <span class="original-price">$${item.originalPrice.toFixed(2)}</span>
                                <span class="discount-label">-50%</span>
                            </div>
                        </div>
                        <div>
                            <button onclick="removeItem('${item.id}')" style="background: #e74c3c; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">Remove</button>
                        </div>
                    </div>
                `).join('')
            }
        </div>
        ${cartItems.length > 0 ? `
            <div class="total">
                Total: $${cartItems.reduce((sum, item) => sum + item.discountedPrice, 0).toFixed(2)}
                <span class="original-price">$${cartItems.reduce((sum, item) => sum + item.originalPrice, 0).toFixed(2)}</span>
            </div>
            <button class="checkout-btn" onclick="checkout()">Checkout - БратЦ снял с тебя $${cartItems.reduce((sum, item) => sum + item.discountedPrice, 0).toFixed(2)}</button>
        ` : ''}
    </div>

    <script>
        function removeItem(itemId) {
            fetch('/cart/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemId })
            }).then(() => location.reload());
        }

        function checkout() {
            alert('БратЦ снял с тебя $' + ${cartItems.reduce((sum, item) => sum + item.discountedPrice, 0).toFixed(2)} + '!');
        }
    </script>
</body>
</html>`;
  
  res.send(cartHtml);
});

// Add to cart
app.post('/cart/add', (req, res) => {
  const { id, title, price } = req.body;
  const originalPrice = parseFloat(price);
  const discountedPrice = originalPrice * 0.5; // 50% discount
  
  const existingItem = cartItems.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({
      id,
      title,
      originalPrice,
      discountedPrice,
      quantity: 1
    });
  }
  
  res.json({ success: true, message: 'Added to cart' });
});

// Remove from cart
app.post('/cart/remove', (req, res) => {
  const { id } = req.body;
  cartItems = cartItems.filter(item => item.id !== id);
  res.json({ success: true });
});

// Intercept add to cart from original site
app.post('/cart/add.js', (req, res) => {
  // Extract product info from request
  const formData = req.body;
  const variantId = formData.id || formData.variant_id;
  const quantity = formData.quantity || 1;
  
  // Mock response for original site
  res.json({
    status: 200,
    message: 'Added to cart',
    cart: {
      item_count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      total_price: cartItems.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0)
    }
  });
});

// Intercept cart.js requests
app.get('/cart.js', (req, res) => {
  res.json({
    item_count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    total_price: cartItems.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0),
    items: cartItems
  });
});

// Inject script to intercept add to cart buttons
app.use('/', (req, res, next) => {
  if (req.path === '/cart' || req.path.startsWith('/cart/')) {
    return next();
  }
  
  // Use proxy for everything else
  const proxy = createProxyMiddleware({
    target: 'https://goaltickets.com',
    changeOrigin: true,
    onProxyRes: (proxyRes, req, res) => {
      if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
        let body = '';
        proxyRes.on('data', (chunk) => {
          body += chunk;
        });
        
        proxyRes.on('end', () => {
          // Inject script to intercept add to cart
          const script = `
            <script>
              // Intercept add to cart buttons
              document.addEventListener('click', function(e) {
                const addToCartBtn = e.target.closest('[data-add-to-cart], .btn-cart, [type="submit"]');
                if (addToCartBtn && addToCartBtn.closest('form')) {
                  e.preventDefault();
                  
                  const form = addToCartBtn.closest('form');
                  const formData = new FormData(form);
                  const productTitle = document.querySelector('h1, .product-title, .product-name')?.textContent || 'Product';
                  const priceElement = document.querySelector('.price, .product-price, [class*="price"]');
                  const price = priceElement ? priceElement.textContent.match(/\\$([\\d.]+)/)?.[1] : '0';
                  
                  fetch('/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: formData.get('id') || formData.get('variant_id') || Date.now(),
                      title: productTitle,
                      price: price
                    })
                  }).then(() => {
                    alert('Added to cart! Price reduced by 50%');
                    // Redirect to cart
                    window.location.href = '/cart';
                  });
                }
              });
              
              // Intercept cart icon clicks
              document.addEventListener('click', function(e) {
                if (e.target.closest('[href*="/cart"], .cart-icon, [data-cart]')) {
                  e.preventDefault();
                  window.location.href = '/cart';
                }
              });
            </script>
          `;
          
          const modifiedBody = body.replace('</body>', script + '</body>');
          res.setHeader('content-length', Buffer.byteLength(modifiedBody));
          res.end(modifiedBody);
        });
      } else {
        next();
      }
    }
  });
  
  proxy(req, res, next);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CUSTOM CART PROXY v${VERSION} running on port ${PORT}`);
  console.log(`📡 Proxying to: https://goaltickets.com`);
  console.log(`🛒 Custom cart at: http://localhost:${PORT}/cart`);
  console.log(`🌐 Access your proxy at: http://localhost:${PORT}`);
});

module.exports = app;