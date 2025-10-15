document.addEventListener("DOMContentLoaded",function(){const script=document.querySelector('script[src*="ticket-variants-premium.js"]'),translations={ticketAddedSuccess:script?.dataset?.ticketAddedSuccess||"Ticket added to cart successfully!",addingToCart:script?.dataset?.addingToCart||"Adding...",addedToCart:script?.dataset?.addedToCart||"Added!"},ticketCards=document.querySelectorAll(".ticket-variant-card");ticketCards.forEach(card=>{const variantId=card.dataset.variantId,decreaseBtn=card.querySelector(".qty-decrease"),increaseBtn=card.querySelector(".qty-increase"),qtyInput=card.querySelector(".qty-input[data-variant-id]")||card.querySelector(".qty-input")||card.querySelector('input[type="number"]'),addToCartBtn=card.querySelector(".add-to-cart-btn");decreaseBtn&&increaseBtn&&qtyInput&&(decreaseBtn.addEventListener("click",()=>{const currentVal=parseInt(qtyInput.value);currentVal>1&&(qtyInput.value=currentVal-1)}),increaseBtn.addEventListener("click",()=>{const currentVal=parseInt(qtyInput.value),maxVal=parseInt(qtyInput.max);currentVal<maxVal&&(qtyInput.value=currentVal+1)}),qtyInput.addEventListener("change",()=>{const val=parseInt(qtyInput.value),maxVal=parseInt(qtyInput.max),minVal=parseInt(qtyInput.min);isNaN(val)||val<minVal?qtyInput.value=minVal:val>maxVal&&(qtyInput.value=maxVal)})),addToCartBtn&&addToCartBtn.addEventListener("click",async function(e){e.preventDefault(),e.stopImmediatePropagation(),console.log("[TicketVariantsPremium] DEBUG - qtyInput:",qtyInput),console.log("[TicketVariantsPremium] DEBUG - qtyInput.tagName:",qtyInput?.tagName),console.log("[TicketVariantsPremium] DEBUG - qtyInput.value:",qtyInput?.value);const quantity=parseInt(qtyInput?.value)||1;console.log("[TicketVariantsPremium] Quantity selected:",quantity,"from",qtyInput?.tagName);const productId=this.dataset.productId;this.classList.add("loading"),this.disabled=!0;const originalText=this.innerHTML;this.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="animate-spin"><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/></svg> '+translations.addingToCart;try{const response=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:[{id:variantId,quantity}]})});if(response.ok){const data=await response.json();if(this.classList.remove("loading"),this.classList.add("success"),this.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> '+translations.addedToCart,updateCartCount(),window.innerWidth<=768){window.location.href="/cart";return}await refreshCartDrawer(),openCartDrawer(),showNotification(translations.ticketAddedSuccess,"success"),setTimeout(()=>{this.classList.remove("success"),this.innerHTML=originalText,this.disabled=!1,qtyInput.value=1},2e3)}else throw new Error("Failed to add to cart")}catch(error){console.error("Error adding to cart:",error),this.classList.remove("loading"),this.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg> Error',showNotification("Failed to add ticket to cart. Please try again.","error"),setTimeout(()=>{this.innerHTML=originalText,this.disabled=!1},2e3)}})});async function updateCartCount(){try{const cart=await(await fetch("/cart.js")).json(),cartCountElement=document.querySelector("cart-count");if(cartCountElement){const countSpan=cartCountElement.querySelector('span[aria-hidden="true"]');countSpan&&(countSpan.textContent=cart.item_count);const srSpan=cartCountElement.querySelector(".sr-only");srSpan&&(srSpan.textContent=srSpan.textContent.replace(/\d+/,cart.item_count)),cart.item_count>0?cartCountElement.classList.remove("opacity-0"):cartCountElement.classList.add("opacity-0")}document.querySelectorAll("[data-cart-count]").forEach(el=>{el.textContent=cart.item_count}),typeof updateCartDrawer=="function"&&updateCartDrawer()}catch(error){console.error("Error updating cart count:",error)}}async function refreshCartDrawer(){try{const sections=await(await fetch("/cart?sections=cart-drawer")).json(),cartDrawer=document.querySelector("cart-drawer");if(cartDrawer&&sections["cart-drawer"]){const tempDiv=document.createElement("div");tempDiv.innerHTML=sections["cart-drawer"];const newContent=tempDiv.querySelector("cart-drawer");newContent&&(cartDrawer.innerHTML=newContent.innerHTML)}}catch(error){console.error("Error refreshing cart drawer:",error)}}function openCartDrawer(){document.dispatchEvent(new CustomEvent("cart-drawer:open"));const cartDrawer=document.querySelector("cart-drawer");cartDrawer&&(typeof cartDrawer.show=="function"?cartDrawer.show():typeof cartDrawer.open=="function"?cartDrawer.open():cartDrawer.setAttribute("open",""));const cartIcon=document.querySelector('[aria-controls="cart-drawer"], .header__icon--cart, .cart-link');cartIcon&&cartIcon.click()}function showNotification(message,type="info"){const existingNotification=document.querySelector(".ticket-notification");existingNotification&&existingNotification.remove();const notification=document.createElement("div");notification.className=`ticket-notification ticket-notification--${type}`,notification.innerHTML=`
      <div class="notification-content">
        ${type==="success"?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>':""}
        ${type==="error"?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>':""}
        <span>${message}</span>
      </div>
    `;const styles=`
      <style>
        .ticket-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease;
          max-width: 400px;
        }
        
        .ticket-notification--success {
          background: #10B981;
          color: white;
        }
        
        .ticket-notification--error {
          background: #EF4444;
          color: white;
        }
        
        .ticket-notification--info {
          background: #3B82F6;
          color: white;
        }
        
        .notification-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
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
        
        .ticket-notification.removing {
          animation: slideOut 0.3s ease;
        }
      </style>
    `;if(!document.querySelector("#ticket-notification-styles")){const styleElement=document.createElement("div");styleElement.id="ticket-notification-styles",styleElement.innerHTML=styles,document.head.appendChild(styleElement)}document.body.appendChild(notification),setTimeout(()=>{notification.classList.add("removing"),setTimeout(()=>{notification.remove()},300)},5e3)}ticketCards.forEach(card=>{card.addEventListener("mouseenter",function(){this.style.transform="translateY(-4px)"}),card.addEventListener("mouseleave",function(){this.style.transform="translateY(0)"})}),document.querySelectorAll(".availability-badge").forEach((badge,index)=>{badge.style.animation=`fadeIn 0.5s ease ${index*.1}s both`});const fadeInStyle=document.createElement("style");fadeInStyle.textContent=`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `,document.head.appendChild(fadeInStyle),ticketCards.forEach(card=>{const variantId=card.dataset.variantId;card.addEventListener("click",function(e){e.target.closest("button")||e.target.closest("input")||typeof gtag<"u"&&gtag("event","view_item",{currency:"USD",value:parseFloat(card.querySelector(".price-value").textContent),items:[{item_id:variantId,item_name:card.querySelector(".ticket-title").textContent.trim(),item_category:card.querySelector(".category-label").textContent.trim(),quantity:1}]})})})});
//# sourceMappingURL=/cdn/shop/t/24/assets/ticket-variants-premium.js.map?v=43983373601450419641760472321
