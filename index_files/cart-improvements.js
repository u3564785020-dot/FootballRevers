(function(){"use strict";console.log("[Cart Improvements] Script disabled for debugging");return;function showSuccessToast(productTitle,quantity){const existingToast=document.querySelector(".cart-success-toast");existingToast&&existingToast.remove();const toast=document.createElement("div");toast.className="cart-success-toast",toast.innerHTML=`
      <svg class="cart-success-toast__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="width" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <div class="cart-success-toast__content">
        <div class="cart-success-toast__title">Added to cart!</div>
        <div class="cart-success-toast__message">${productTitle} ${quantity>1?`(${quantity})`:""}</div>
        <div class="cart-success-toast__actions">
          <button class="cart-success-toast__button" onclick="document.querySelector('cart-drawer').show(); this.closest('.cart-success-toast').remove();">
            View Cart
          </button>
          <button class="cart-success-toast__button cart-success-toast__button--secondary" onclick="this.closest('.cart-success-toast').remove();">
            Continue Shopping
          </button>
        </div>
      </div>
    `,document.body.appendChild(toast),setTimeout(()=>{toast.parentNode&&(toast.style.animation="slideOut 0.3s ease-in",setTimeout(()=>toast.remove(),300))},5e3)}function interceptAddToCart(){document.addEventListener("variant:add",function(e){console.log("Product added to cart via theme.js:",e.detail);const items=e.detail.items||[];if(items.length>0){const item=items[0],productTitle=item.product_title||item.title||"Product",quantity=item.quantity||1;showSuccessToast(productTitle,quantity),refreshCartDrawer().then(()=>{updateCartCount();const cartDrawer=document.querySelector("cart-drawer");cartDrawer&&(typeof cartDrawer.show=="function"?cartDrawer.show():typeof cartDrawer.open=="function"?cartDrawer.open():cartDrawer.setAttribute("open",""),console.log("Cart drawer opened"))})}})}function updateCartCount(){fetch("/cart.js").then(response=>response.json()).then(cart=>{document.querySelectorAll("cart-count, [data-cart-count]").forEach(el=>{el.textContent=cart.item_count,el.setAttribute("data-items",cart.item_count)});const cartIcon=document.querySelector(".header__cart-count, .cart-count");cartIcon&&(cartIcon.textContent=cart.item_count)}).catch(error=>console.error("Failed to update cart count:",error))}function refreshCartDrawer(){const cartDrawer=document.querySelector("cart-drawer");return cartDrawer?fetch("/cart.js").then(response=>response.json()).then(cart=>{console.log("Cart data fetched:",cart),document.documentElement.dispatchEvent(new CustomEvent("cart:refresh",{bubbles:!0,detail:{cart}}));const sections=cartDrawer.getAttribute("sections")||"cart-drawer";return fetch(`${window.Shopify.routes.root}?sections=${sections}`).then(response=>response.json()).then(sectionsData=>{const cartDrawerData=sectionsData["cart-drawer"];if(cartDrawerData){const newDrawer=new DOMParser().parseFromString(cartDrawerData,"text/html").querySelector("cart-drawer");newDrawer&&(cartDrawer.innerHTML=newDrawer.innerHTML,console.log("Cart drawer updated"))}})}).catch(error=>{throw console.error("Failed to refresh cart:",error),error}):(console.log("Cart drawer not found"),Promise.reject("Cart drawer not found"))}function handleQuantityChanges(){document.addEventListener("change",function(e){if(e.target.matches(".quantity-input")){const input=e.target,lineKey=input.getAttribute("data-line-key"),newQuantity=parseInt(input.value);lineKey&&newQuantity>=0&&fetch("/cart/change.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:lineKey,quantity:newQuantity})}).then(response=>response.json()).then(cart=>(console.log("Cart updated:",cart),updateCartCount(),refreshCartDrawer())).catch(error=>{console.error("Failed to update quantity:",error),input.value=input.getAttribute("value")})}})}function init(){interceptAddToCart(),handleQuantityChanges();const style=document.createElement("style");style.textContent=`
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `,document.head.appendChild(style),console.log("Cart improvements initialized")}})();
//# sourceMappingURL=/cdn/shop/t/24/assets/cart-improvements.js.map?v=31468835431535109571760459484
