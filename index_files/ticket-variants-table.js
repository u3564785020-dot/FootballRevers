class TicketVariantsTable{constructor(){this.selectedVariants=new Map,this.init()}init(){this.setupQuantitySelectors(),this.setupAddToCartButtons(),this.observeCartUpdates()}getAllowedQuantities(maxInventory){const max=parseInt(maxInventory);if(isNaN(max)||max<=0)return[1];if(max===1)return[1];if(max===2)return[2];const allowed=[];for(let i=1;i<=max;i++)max-i!==1&&allowed.push(i);return allowed}replaceWithDropdown(input){if(input.tagName==="SELECT"||input.classList.contains("qty-dropdown-processed"))return;const maxInventory=parseInt(input.getAttribute("max"))||parseInt(input.dataset.max)||10,currentValue=parseInt(input.value)||1,allowedQuantities=this.getAllowedQuantities(maxInventory),select=document.createElement("select");select.className=input.className+" qty-dropdown",select.name=input.name,select.id=input.id,Array.from(input.attributes).forEach(attr=>{attr.name.startsWith("data-")&&select.setAttribute(attr.name,attr.value)});let defaultValue=allowedQuantities[0];allowedQuantities.forEach(qty=>{const option=document.createElement("option");option.value=qty,option.textContent=qty,qty===currentValue&&(option.selected=!0,defaultValue=qty),select.appendChild(option)}),select.value=defaultValue,select.addEventListener("change",e=>{const variantId=e.target.dataset.variantId;this.updateBulkSelection(variantId,e.target.value)}),input.parentNode.replaceChild(select,input);const parent=select.parentNode;return parent&&parent.querySelectorAll(".qty-minus, .qty-plus, .qty-decrease, .qty-increase").forEach(btn=>{btn.style.display="none"}),console.log("[TicketVariantsTable] Replaced input with dropdown. Max:",maxInventory,"Allowed:",allowedQuantities.join(", "),"Selected:",defaultValue),select}setupQuantitySelectors(){document.querySelectorAll('.qty-input, input[type="number"][name*="quantity"]').forEach(input=>{input.closest("cart-drawer")||input.closest(".cart-drawer")||input.closest("#cart")||this.replaceWithDropdown(input)}),document.querySelectorAll(".qty-minus, .qty-decrease").forEach(btn=>{btn.addEventListener("click",e=>{const variantId=e.currentTarget.dataset.variantId,input=document.querySelector(`.qty-input[data-variant-id="${variantId}"]`)||document.querySelector(`#qty-${variantId}`)||document.querySelector(`#mobile-qty-${variantId}`);if(input&&input.tagName==="INPUT"){const currentValue=parseInt(input.value)||1,minValue=parseInt(input.min)||1;currentValue>minValue&&(input.value=currentValue-1,this.updateBulkSelection(variantId,currentValue-1))}})}),document.querySelectorAll(".qty-plus, .qty-increase").forEach(btn=>{btn.addEventListener("click",e=>{const variantId=e.currentTarget.dataset.variantId,input=document.querySelector(`.qty-input[data-variant-id="${variantId}"]`)||document.querySelector(`#qty-${variantId}`)||document.querySelector(`#mobile-qty-${variantId}`);if(input&&input.tagName==="INPUT"){const currentValue=parseInt(input.value)||1,maxValue=parseInt(input.max)||999;currentValue<maxValue&&(input.value=currentValue+1,this.updateBulkSelection(variantId,currentValue+1))}})})}setupAddToCartButtons(){document.querySelectorAll(".add-to-cart-btn").forEach(btn=>{btn.addEventListener("click",async e=>{e.preventDefault(),e.stopImmediatePropagation();const button=e.currentTarget,variantId=button.dataset.variantId,productId=button.dataset.productId,qtyElement=document.querySelector(`.qty-input[data-variant-id="${variantId}"]`)||document.querySelector(`.qty-dropdown[data-variant-id="${variantId}"]`)||document.querySelector(`#qty-${variantId}`)||document.querySelector(`#mobile-qty-${variantId}`);console.log("[TicketVariantsTable] Add to cart clicked"),console.log("[TicketVariantsTable] variantId:",variantId),console.log("[TicketVariantsTable] qtyElement found:",qtyElement),console.log("[TicketVariantsTable] qtyElement value:",qtyElement?.value);const quantity=parseInt(qtyElement?.value)||1;console.log("[TicketVariantsTable] Quantity to add:",quantity),await this.addToCart(variantId,quantity,button)})})}async addToCart(variantId,quantity,button){button.classList.add("loading"),button.disabled=!0;try{const formData={items:[{id:variantId,quantity:parseInt(quantity)}]},response=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(formData)});if(!response.ok){const errorData=await response.text();throw console.error("Cart add failed:",errorData),new Error("Failed to add to cart")}const data=await response.json();console.log("Added to cart:",data),button.classList.remove("loading"),button.classList.add("success"),button.innerHTML=`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Added!</span>
      `,this.updateCartUI(data),await this.updateCartBubble(),await this.refreshCartDrawer(),this.openCartDrawer(),setTimeout(()=>{button.classList.remove("success"),button.disabled=!1,button.innerHTML=`
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 2L3 9H12L18 2M3 9V20C3 21 4 22 5 22H19C20 22 21 21 21 20V9M3 9H21M18 2H6"/>
          </svg>
          <span>Add to Cart</span>
        `},2e3),this.showNotification(`Added ${quantity} ticket${quantity>1?"s":""} to cart!`,"success")}catch(error){console.error("Error adding to cart:",error),button.classList.remove("loading"),button.disabled=!1,this.showNotification("Failed to add to cart. Please try again.","error")}}setupBulkSelection(){document.querySelectorAll(".variant-row:not(.sold-out-row)").forEach(row=>{const variantId=row.dataset.variantId,sectionCell=row.querySelector(".section-column");if(sectionCell){const checkbox=document.createElement("input");checkbox.type="checkbox",checkbox.className="variant-checkbox",checkbox.dataset.variantId=variantId,checkbox.style.marginRight="10px",checkbox.addEventListener("change",e=>{this.handleCheckboxChange(e.target)}),sectionCell.prepend(checkbox)}});const bulkAddBtn=document.getElementById("bulk-add-to-cart");bulkAddBtn&&bulkAddBtn.addEventListener("click",()=>{this.bulkAddToCart()})}handleCheckboxChange(checkbox){const variantId=checkbox.dataset.variantId,row=checkbox.closest(".variant-row");if(checkbox.checked){row.classList.add("selected");const qtyInput=row.querySelector(".qty-input"),quantity=parseInt(qtyInput?.value)||1,price=parseFloat(row.dataset.variantPrice)||0;this.selectedVariants.set(variantId,{quantity,price})}else row.classList.remove("selected"),this.selectedVariants.delete(variantId);this.updateBulkSelectionUI()}updateBulkSelection(variantId,quantity){const checkbox=document.querySelector(`.variant-checkbox[data-variant-id="${variantId}"]`);if(checkbox&&checkbox.checked){const row=checkbox.closest(".variant-row"),price=parseFloat(row.dataset.variantPrice)||0;this.selectedVariants.set(variantId,{quantity:parseInt(quantity),price}),this.updateBulkSelectionUI()}}updateBulkSelectionUI(){const footer=document.getElementById("bulk-selection-footer"),countSpan=document.getElementById("selected-count"),totalSpan=document.getElementById("selected-total");if(footer)if(this.selectedVariants.size>0){footer.style.display="flex";let totalQuantity=0,totalPrice=0;this.selectedVariants.forEach(item=>{totalQuantity+=item.quantity,totalPrice+=item.price*item.quantity}),countSpan.textContent=totalQuantity,totalSpan.textContent=this.formatMoney(totalPrice)}else footer.style.display="none"}async bulkAddToCart(){const button=document.getElementById("bulk-add-to-cart");if(!button||this.selectedVariants.size===0)return;button.disabled=!0,button.textContent="Adding to cart...";const items=[];this.selectedVariants.forEach((item,variantId)=>{items.push({id:variantId,quantity:item.quantity})});try{const response=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items})});if(!response.ok)throw new Error("Failed to add items to cart");const data=await response.json();document.querySelectorAll(".variant-checkbox:checked").forEach(checkbox=>{checkbox.checked=!1,checkbox.closest(".variant-row").classList.remove("selected")}),this.selectedVariants.clear(),this.updateBulkSelectionUI(),button.textContent="Added to cart!",button.classList.add("success"),setTimeout(()=>{button.disabled=!1,button.textContent="Add Selected to Cart",button.classList.remove("success")},2e3),this.showNotification(`Added ${items.length} items to cart!`,"success"),this.updateCartBubble(),this.openCartDrawer()}catch(error){console.error("Error adding items to cart:",error),button.disabled=!1,button.textContent="Add Selected to Cart",this.showNotification("Failed to add items to cart. Please try again.","error")}}updateCartUI(data){document.dispatchEvent(new CustomEvent("cart:updated",{detail:data}))}async updateCartBubble(){try{const cart=await(await fetch("/cart.js",{headers:{Accept:"application/json"}})).json();console.log("Cart contents:",cart);const cartCountElement=document.querySelector("cart-count");if(cartCountElement){const countSpan=cartCountElement.querySelector('span[aria-hidden="true"]');countSpan&&(countSpan.textContent=cart.item_count);const srSpan=cartCountElement.querySelector(".sr-only");srSpan&&(srSpan.textContent=srSpan.textContent.replace(/\d+/,cart.item_count)),cart.item_count>0?cartCountElement.classList.remove("opacity-0"):cartCountElement.classList.add("opacity-0")}document.querySelectorAll(".cart-count-bubble, .cart-count, .cart-count__bubble").forEach(element=>{if(element&&element.tagName!=="CART-COUNT"){const countSpan=element.querySelector("span")||element;countSpan.textContent=cart.item_count,cart.item_count>0?(element.classList.remove("hide"),element.style.display=""):element.classList.add("hide")}}),document.dispatchEvent(new CustomEvent("cart:updated",{detail:{cart}}))}catch(error){console.error("Error updating cart bubble:",error)}}async refreshCartDrawer(){try{const sections=await(await fetch("/cart?sections=cart-drawer,cart-icon-bubble")).json(),cartDrawer=document.querySelector("cart-drawer");if(cartDrawer&&sections["cart-drawer"]){const tempDiv=document.createElement("div");tempDiv.innerHTML=sections["cart-drawer"];const newCartContent=tempDiv.querySelector("cart-drawer");newCartContent&&(cartDrawer.innerHTML=newCartContent.innerHTML)}if(sections["cart-icon-bubble"]){const cartIconBubble=document.querySelector(".header__icon--cart");if(cartIconBubble){const tempDiv=document.createElement("div");tempDiv.innerHTML=sections["cart-icon-bubble"];const newBubble=tempDiv.querySelector(".cart-count-bubble"),currentBubble=cartIconBubble.querySelector(".cart-count-bubble");newBubble&&currentBubble&&currentBubble.replaceWith(newBubble)}}}catch(error){console.error("Error refreshing cart drawer:",error)}}openCartDrawer(){document.dispatchEvent(new CustomEvent("cart-drawer:open"));const cartDrawer=document.querySelector("cart-drawer");cartDrawer&&(typeof cartDrawer.show=="function"?cartDrawer.show():typeof cartDrawer.open=="function"?cartDrawer.open():cartDrawer.setAttribute("open",""));const cartIcon=document.querySelector('[aria-controls="cart-drawer"], .header__icon--cart, .cart-link');cartIcon&&cartIcon.click()}showNotification(message,type="success"){const notification=document.createElement("div");notification.className=`ticket-notification ${type}`,notification.innerHTML=`
      <div class="notification-content">
        ${type==="success"?'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'}
        <span>${message}</span>
      </div>
    `,document.body.appendChild(notification),setTimeout(()=>notification.classList.add("show"),10),setTimeout(()=>{notification.classList.remove("show"),setTimeout(()=>notification.remove(),300)},3e3)}formatMoney(cents){const dollars=cents/100;return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(dollars)}observeCartUpdates(){document.addEventListener("cart:updated",e=>{console.log("Cart updated:",e.detail)})}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{new TicketVariantsTable}):new TicketVariantsTable;const notificationStyles=document.createElement("style");notificationStyles.textContent=`
  .ticket-notification {
    position: fixed;
    top: 20px;
    right: -400px;
    background: white;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: right 0.3s ease;
    z-index: 99999;
    max-width: 90%;
  }
  
  .ticket-notification.show {
    right: 20px;
  }
  
  .ticket-notification.success {
    border-left: 4px solid #10b981;
  }
  
  .ticket-notification.error {
    border-left: 4px solid #ef4444;
  }
  
  .ticket-notification .notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .ticket-notification.success svg {
    color: #10b981;
  }
  
  .ticket-notification.error svg {
    color: #ef4444;
  }
  
  .variant-row.selected {
    background: linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%) !important;
  }
  
  .variant-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  @media (max-width: 768px) {
    .ticket-notification {
      top: auto;
      bottom: 20px;
      right: 10px;
      left: 10px;
      max-width: calc(100% - 20px);
    }
    
    .ticket-notification.show {
      right: 10px;
    }
  }
`,document.head.appendChild(notificationStyles);
//# sourceMappingURL=/cdn/shop/t/24/assets/ticket-variants-table.js.map?v=132632185083956232301760474723
