class PremiumCart{constructor(){this.cart=null,this.drawer=document.querySelector("cart-drawer"),this.init()}init(){this.fetchCart(),this.bindEvents(),this.initAnimations(),this.initUpsells(),this.initPromoCode()}async fetchCart(){try{const response=await fetch("/cart.js");this.cart=await response.json(),this.updateCartUI()}catch(error){console.error("Error fetching cart:",error)}}bindEvents(){document.addEventListener("click",async e=>{if(e.target.closest("[data-add-to-cart]")){e.preventDefault();const button=e.target.closest("[data-add-to-cart]"),productId=button.dataset.productId,variantId=button.dataset.variantId||await this.getDefaultVariant(productId);await this.addToCart(variantId,1),this.showAddedAnimation(button)}if(e.target.closest(".btn-add-to-cart")){e.preventDefault();const button=e.target.closest(".btn-add-to-cart"),productId=button.dataset.productId;await this.quickAddToCart(productId),this.showAddedAnimation(button)}if(e.target.closest("[data-remove-item]")){const key=e.target.closest("[data-remove-item]").dataset.removeItem;await this.removeFromCart(key)}e.target.closest("[data-open-cart]")&&(e.preventDefault(),this.openDrawer()),e.target.closest("[data-close-cart]")&&(e.preventDefault(),this.closeDrawer())}),document.addEventListener("click",e=>{if(e.target.closest("[data-qty-adjust]")){e.preventDefault();const button=e.target.closest("[data-qty-adjust]"),key=button.dataset.key,adjustment=parseInt(button.dataset.qtyAdjust),input=document.querySelector(`.qty-input[data-key="${key}"]`)||document.querySelector(`.qty-input[data-line-key="${key}"]`);if(input){const currentQty=parseInt(input.value)||1,minQty=parseInt(input.min)||1,maxQty=parseInt(input.max)||9999,newQty=Math.max(minQty,Math.min(maxQty,currentQty+adjustment));console.log("[PremiumCart] Quantity button clicked:",{currentQty,adjustment,newQty,min:minQty,max:maxQty}),input.value=newQty,input.dispatchEvent(new Event("change",{bubbles:!0}))}}}),document.addEventListener("change",async e=>{if(e.target.classList.contains("qty-input")&&!e.target.closest("line-item-quantity")){const key=e.target.dataset.key,quantity=parseInt(e.target.value);console.log("[PremiumCart] Quantity input changed (non-line-item):",{key,quantity}),quantity>0&&await this.updateQuantity(key,quantity)}}),document.addEventListener("keydown",e=>{e.key==="Escape"&&this.drawer?.hasAttribute("open")&&this.closeDrawer()})}async addToCart(variantId,quantity=1){try{(await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:[{id:variantId,quantity}]})})).ok&&(await this.fetchCart(),await this.openDrawer(!0),this.showNotification("Added to cart!","success"),this.updateCartCount(),this.triggerConfetti())}catch(error){console.error("Error adding to cart:",error),this.showNotification("Error adding to cart","error")}}async quickAddToCart(productId){try{const product=await(await fetch(`/products/${productId}.js`)).json(),variant=product.variants.find(v=>v.available)||product.variants[0];variant&&await this.addToCart(variant.id,1)}catch(error){console.error("Error with quick add:",error)}}async updateQuantity(key,quantity){try{(await fetch("/cart/change.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:key,quantity})})).ok&&(await this.fetchCart(),this.animateCartUpdate())}catch(error){console.error("Error updating quantity:",error)}}async removeFromCart(key){try{const item=document.querySelector(`[data-key="${key}"]`);item&&(item.style.animation="slideOut 0.3s ease",await new Promise(resolve=>setTimeout(resolve,300))),await this.updateQuantity(key,0),this.showNotification("Item removed","info")}catch(error){console.error("Error removing item:",error)}}updateCartUI(){if(!this.cart)return;this.updateCartCount();const itemsContainer=document.querySelector("[data-cart-items]");itemsContainer&&(this.cart.item_count===0?itemsContainer.innerHTML=this.getEmptyCartHTML():itemsContainer.innerHTML=this.cart.items.map(item=>this.getCartItemHTML(item)).join(""),this.updateCartSummary(),this.updateShippingProgress())}getCartItemHTML(item){return`
      <div class="cart-item" data-cart-item data-key="${item.key}">
        <div class="cart-item__image">
          ${item.image?`<img src="${item.image}" alt="${item.title}" loading="lazy">`:""}
          ${item.properties?.event_date?`
            <div class="event-date-overlay">
              ${new Date(item.properties.event_date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
            </div>
          `:""}
        </div>
        
        <div class="cart-item__details">
          <h3 class="cart-item__title">
            <a href="${item.url}">${item.product_title}</a>
          </h3>
          
          ${item.properties?.venue?`
            <p class="cart-item__venue">\u{1F4CD} ${item.properties.venue}</p>
          `:""}
          
          ${item.variant_title&&item.variant_title!=="Default Title"?`
            <div class="cart-item__variants">
              <span class="variant-tag">${item.variant_title}</span>
            </div>
          `:""}
          
          <div class="cart-item__price-quantity">
            <div class="quantity-selector">
              <button class="qty-btn qty-minus" data-qty-adjust="-1" data-key="${item.key}">-</button>
              <input type="number" class="qty-input" value="${item.quantity}" min="1" data-key="${item.key}">
              <button class="qty-btn qty-plus" data-qty-adjust="1" data-key="${item.key}">+</button>
            </div>
            
            <div class="cart-item__price">
              ${item.original_price!==item.final_price?`
                <span class="price-compare">${this.formatMoney(item.original_price)}</span>
              `:""}
              <span class="price-final">${this.formatMoney(item.final_price)}</span>
            </div>
          </div>
          
          <button class="cart-item__remove" data-remove-item="${item.key}">Remove</button>
        </div>
      </div>
    `}getEmptyCartHTML(){return`
      <div class="cart-empty">
        <div class="empty-cart-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <h3>Your cart is empty</h3>
        <p>Time to grab some amazing tickets!</p>
        <a href="/collections/all" class="btn-continue-shopping">Browse Events</a>
      </div>
    `}updateCartSummary(){const summaryElements={subtotal:document.querySelector("[data-cart-subtotal]"),discount:document.querySelector("[data-cart-discount]"),total:document.querySelector("[data-cart-total]")};summaryElements.subtotal&&(summaryElements.subtotal.textContent=this.formatMoney(this.cart.items_subtotal_price)),summaryElements.discount&&this.cart.total_discount>0&&(summaryElements.discount.textContent=`-${this.formatMoney(this.cart.total_discount)}`,summaryElements.discount.closest(".summary-row").style.display="flex"),summaryElements.total&&(summaryElements.total.textContent=this.formatMoney(this.cart.total_price))}updateCartCount(){const cartCountElement=document.querySelector("cart-count");if(cartCountElement){const countSpan=cartCountElement.querySelector('span[aria-hidden="true"]');countSpan&&(countSpan.textContent=this.cart.item_count);const srSpan=cartCountElement.querySelector(".sr-only");srSpan&&(srSpan.textContent=srSpan.textContent.replace(/\d+/,this.cart.item_count)),this.cart.item_count>0?cartCountElement.classList.remove("opacity-0"):cartCountElement.classList.add("opacity-0"),cartCountElement.style.animation="none",setTimeout(()=>{cartCountElement.style.animation="pulse 0.5s ease"},10)}document.querySelectorAll("[data-cart-count]").forEach(el=>{el.textContent=this.cart.item_count,el.style.animation="none",setTimeout(()=>{el.style.animation="pulse 0.5s ease"},10)})}updateShippingProgress(){const progress=Math.min(100,this.cart.total_price/1e4*100),remaining=Math.max(0,1e4-this.cart.total_price),progressBar=document.querySelector(".progress-fill"),progressText=document.querySelector(".progress-text");progressBar&&(progressBar.style.width=`${progress}%`),progressText&&(progress>=100?(progressText.innerHTML="<strong>\u{1F389} Congrats! You've unlocked FREE SHIPPING!</strong>",progressText.classList.add("success")):(progressText.innerHTML=`
          <span class="highlight">${this.formatMoney(remaining)}</span> away from <strong>FREE SHIPPING!</strong> \u{1F680}
        `,progressText.classList.remove("success")))}async openDrawer(skipFetch=!1){this.drawer&&(skipFetch||await this.fetchCart(),this.drawer.setAttribute("open",""),document.body.style.overflow="hidden")}closeDrawer(){this.drawer&&(this.drawer.removeAttribute("open"),document.body.style.overflow="")}showNotification(message,type="success"){const notification=document.createElement("div");notification.className=`cart-notification cart-notification--${type}`,notification.innerHTML=`
      <div class="notification-content">
        <span class="notification-icon">${type==="success"?"\u2713":"!"}</span>
        <span class="notification-message">${message}</span>
      </div>
    `,document.body.appendChild(notification),setTimeout(()=>notification.classList.add("show"),100),setTimeout(()=>{notification.classList.remove("show"),setTimeout(()=>notification.remove(),300)},3e3)}showAddedAnimation(button){const originalText=button.innerHTML;button.innerHTML="\u2713 Added!",button.classList.add("added"),setTimeout(()=>{button.innerHTML=originalText,button.classList.remove("added")},2e3)}animateCartUpdate(){document.querySelectorAll(".cart-item").forEach((item,index)=>{item.style.animation="none",setTimeout(()=>{item.style.animation=`slideIn 0.3s ease ${index*.05}s`},10)})}initAnimations(){const style=document.createElement("style");style.innerHTML=`
      @keyframes slideOut {
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      .cart-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
      }
      
      .cart-notification.show {
        transform: translateX(0);
      }
      
      .cart-notification--success {
        border-left: 4px solid #10b981;
      }
      
      .cart-notification--error {
        border-left: 4px solid #ef4444;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      
      .notification-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      
      .cart-notification--success .notification-icon {
        background: #dcfce7;
        color: #10b981;
      }
      
      .cart-notification--error .notification-icon {
        background: #fee2e2;
        color: #ef4444;
      }
      
      .btn-add-to-cart.added {
        background: #10b981 !important;
        animation: pulse 0.5s ease;
      }
    `,document.head.appendChild(style)}initUpsells(){}initPromoCode(){console.log("[PremiumCart] Initializing promo code functionality..."),document.addEventListener("click",e=>{if(e.target.classList.contains("btn-apply-promo")||e.target.closest(".btn-apply-promo")){e.preventDefault();const button=e.target.classList.contains("btn-apply-promo")?e.target:e.target.closest(".btn-apply-promo"),input=(button.closest(".promo-input-wrapper")||button.closest(".cart-drawer__promo")||button.closest(".cart-page__promo"))?.querySelector(".promo-input");if(input){const code=input.value.trim();code?this.applyPromoCode(code,button,input):this.showNotification("Please enter a promo code","error")}}}),document.addEventListener("keypress",e=>{if(e.key==="Enter"&&e.target.classList.contains("promo-input")){e.preventDefault();const input=e.target,code=input.value.trim();if(code){const button=(input.closest(".promo-input-wrapper")||input.closest(".cart-drawer__promo")||input.closest(".cart-page__promo"))?.querySelector(".btn-apply-promo");this.applyPromoCode(code,button,input)}else this.showNotification("Please enter a promo code","error")}}),this.updateCheckoutButtons(),console.log("[PremiumCart] Promo code functionality initialized")}applyPromoCode(code,button,input){console.log("[PremiumCart] Applying promo code:",code);try{sessionStorage.setItem("discount_code",code),localStorage.setItem("discount_code",code),button&&(button.disabled=!0,button.textContent="Applying..."),this.showNotification(`Discount code "${code}" saved! It will be applied at checkout.`,"success"),input&&(input.value=""),this.updateCheckoutButtons(),button&&setTimeout(()=>{button.disabled=!1,button.textContent="Apply"},1e3),console.log("[PremiumCart] Promo code saved successfully")}catch(error){console.error("[PremiumCart] Error applying promo code:",error),this.showNotification("Error processing promo code","error"),button&&(button.disabled=!1,button.textContent="Apply")}}updateCheckoutButtons(){const discountCode=sessionStorage.getItem("discount_code")||localStorage.getItem("discount_code");discountCode&&(console.log("[PremiumCart] Updating checkout buttons with discount:",discountCode),document.querySelectorAll('button[name="checkout"], a[href*="/checkout"], .cart__checkout-button, #checkout, [href="/checkout"]').forEach(button=>{if(button.tagName==="A"){const url=new URL(button.href);url.searchParams.set("discount",discountCode),button.href=url.toString()}else button.tagName==="BUTTON"&&button.addEventListener("click",e=>{e.preventDefault(),window.location.href=`/checkout?discount=${encodeURIComponent(discountCode)}`})}))}triggerConfetti(){if(typeof confetti>"u"){const script=document.createElement("script");script.src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js",script.onload=()=>this.fireConfetti(),document.head.appendChild(script)}else this.fireConfetti()}fireConfetti(){typeof confetti<"u"&&confetti({particleCount:100,spread:70,origin:{y:.6}})}formatMoney(cents){return`$${(cents/100).toFixed(2)}`}async getDefaultVariant(productId){try{return(await(await fetch(`/products/${productId}.js`)).json()).variants[0].id}catch(error){return console.error("Error getting default variant:",error),null}}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{window.premiumCart=new PremiumCart}):window.premiumCart=new PremiumCart;class CartDrawer extends HTMLElement{constructor(){super(),this.addEventListener("click",e=>{e.target===this&&this.close()})}open(){this.setAttribute("open",""),document.body.style.overflow="hidden"}close(){this.removeAttribute("open"),document.body.style.overflow=""}}customElements.get("cart-drawer")||customElements.define("cart-drawer",CartDrawer);
//# sourceMappingURL=/cdn/shop/t/24/assets/premium-cart.js.map?v=86511309836789360671760470603
