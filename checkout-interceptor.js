// 🎯 CHECKOUT INTERCEPTOR - Перехватывает все переходы на checkout
(function() {
    'use strict';
    
    console.log('🎯 Checkout Interceptor loaded');
    
    // Перехватываем все клики на кнопки checkout
    function interceptCheckoutClicks() {
        document.addEventListener('click', function(event) {
            const target = event.target;
            const text = target.textContent?.toLowerCase() || '';
            const href = target.href || '';
            const onclick = target.onclick?.toString() || '';
            
            // Проверяем различные варианты checkout кнопок
            if (
                text.includes('checkout') || 
                text.includes('купить') ||
                text.includes('оформить') ||
                text.includes('заказать') ||
                href.includes('checkout') ||
                onclick.includes('checkout') ||
                target.classList.contains('checkout') ||
                target.id.includes('checkout')
            ) {
                console.log('🎯 Checkout button clicked:', target);
                event.preventDefault();
                event.stopPropagation();
                
                // Показываем уведомление
                showNotification('Перенаправляем на checkout...');
                
                // Перенаправляем на нашу страницу
                setTimeout(() => {
                    window.location.href = '/checkout';
                }, 500);
                
                return false;
            }
        });
    }
    
    // Перехватываем формы отправки
    function interceptForms() {
        document.addEventListener('submit', function(event) {
            const form = event.target;
            const action = form.action?.toLowerCase() || '';
            const method = form.method?.toLowerCase() || 'get';
            
            if (action.includes('checkout') || action.includes('cart')) {
                console.log('🎯 Form submission intercepted:', form);
                event.preventDefault();
                
                showNotification('Обрабатываем заказ...');
                
                setTimeout(() => {
                    window.location.href = '/checkout';
                }, 1000);
                
                return false;
            }
        });
    }
    
    // Перехватываем AJAX запросы
    function interceptAjax() {
        const originalFetch = window.fetch;
        const originalXHR = window.XMLHttpRequest.prototype.open;
        
        // Перехватываем fetch
        window.fetch = function(...args) {
            const url = args[0]?.toString() || '';
            if (url.includes('checkout') || url.includes('cart')) {
                console.log('🎯 Fetch request intercepted:', url);
                return Promise.resolve(new Response(JSON.stringify({
                    success: true,
                    redirect: '/checkout'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
            return originalFetch.apply(this, args);
        };
        
        // Перехватываем XMLHttpRequest
        window.XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (url.includes('checkout') || url.includes('cart')) {
                console.log('🎯 XHR request intercepted:', url);
                this.addEventListener('load', function() {
                    if (this.status === 200) {
                        window.location.href = '/checkout';
                    }
                });
            }
            return originalXHR.call(this, method, url, ...args);
        };
    }
    
    // Показываем уведомление
    function showNotification(message) {
        // Удаляем предыдущие уведомления
        const existing = document.querySelector('.checkout-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'checkout-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-weight: bold;
                animation: slideIn 0.3s ease;
            ">
                ${message}
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Запускаем перехватчики
    function init() {
        console.log('🎯 Initializing checkout interceptors...');
        
        // Если DOM уже загружен
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                interceptCheckoutClicks();
                interceptForms();
                interceptAjax();
            });
        } else {
            // DOM уже загружен
            interceptCheckoutClicks();
            interceptForms();
            interceptAjax();
        }
        
        // Дополнительная проверка через 2 секунды
        setTimeout(() => {
            interceptCheckoutClicks();
        }, 2000);
    }
    
    // Запускаем
    init();
    
    console.log('🎯 Checkout Interceptor ready!');
})();
