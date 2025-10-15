class GoalTicketsEnhancements{constructor(){this.init()}init(){this.initScrollAnimations(),this.initCountdownTimers(),this.initParallaxEffects(),this.initTicketCards(),this.initNotifications(),this.initLoadingStates(),this.initTrustBadges(),this.initVideoBackgrounds(),this.initMicroInteractions()}initScrollAnimations(){const observerOptions={threshold:.1,rootMargin:"0px 0px -50px 0px"},observer=new IntersectionObserver(entries=>{entries.forEach((entry,index)=>{entry.isIntersecting&&setTimeout(()=>{entry.target.classList.add("revealed"),entry.target.style.animationDelay=`${index*.1}s`},index*100)})},observerOptions);document.querySelectorAll(".scroll-reveal").forEach(el=>{observer.observe(el)}),document.querySelectorAll(".stagger-animation").forEach(container=>{const children=container.children;Array.from(children).forEach((child,index)=>{child.style.animationDelay=`${index*.1}s`,child.classList.add("scroll-reveal")})})}initCountdownTimers(){document.querySelectorAll("[data-countdown]").forEach(countdown=>{const targetDate=new Date(countdown.dataset.countdown).getTime(),updateCountdown=()=>{const now=new Date().getTime(),distance=targetDate-now;if(distance<0){countdown.innerHTML='<span class="countdown-expired">Event Started!</span>';return}const days=Math.floor(distance/(1e3*60*60*24)),hours=Math.floor(distance%(1e3*60*60*24)/(1e3*60*60)),minutes=Math.floor(distance%(1e3*60*60)/(1e3*60)),seconds=Math.floor(distance%(1e3*60)/1e3);countdown.innerHTML=`
          <div class="countdown-container">
            <div class="countdown-item">
              <span class="countdown-number">${days}</span>
              <span class="countdown-label">Days</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-number">${hours.toString().padStart(2,"0")}</span>
              <span class="countdown-label">Hours</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-number">${minutes.toString().padStart(2,"0")}</span>
              <span class="countdown-label">Minutes</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-number">${seconds.toString().padStart(2,"0")}</span>
              <span class="countdown-label">Seconds</span>
            </div>
          </div>
        `};updateCountdown(),setInterval(updateCountdown,1e3)})}initParallaxEffects(){const parallaxElements=document.querySelectorAll(".parallax");window.addEventListener("scroll",()=>{const scrolled=window.pageYOffset;parallaxElements.forEach(el=>{const speed=el.dataset.speed||.5,offset=scrolled*speed;el.style.setProperty("--parallax-offset",`${offset}px`)})})}initTicketCards(){document.querySelectorAll(".ticket-card").forEach(card=>{card.addEventListener("mousemove",e=>{const rect=card.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,centerX=rect.width/2,centerY=rect.height/2,rotateX=(y-centerY)/10,rotateY=(centerX-x)/10;card.style.transform=`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`}),card.addEventListener("mouseleave",()=>{card.style.transform="perspective(1000px) rotateX(0) rotateY(0)"}),card.addEventListener("click",function(e){const ripple=document.createElement("span");ripple.className="ripple";const rect=this.getBoundingClientRect(),size=Math.max(rect.width,rect.height),x=e.clientX-rect.left-size/2,y=e.clientY-rect.top-size/2;ripple.style.width=ripple.style.height=size+"px",ripple.style.left=x+"px",ripple.style.top=y+"px",this.appendChild(ripple),setTimeout(()=>ripple.remove(),600)})})}initNotifications(){const notifications=[{title:"New Booking!",text:"Someone just bought World Cup tickets",icon:"\u{1F3AB}"},{title:"Limited Seats!",text:"Only 4 tickets left for Champions League Final",icon:"\u26A1"},{title:"Hot Deal!",text:"10% off French Open Finals",icon:"\u{1F525}"},{title:"Just Sold!",text:"French Open Quarter-Final tickets",icon:"\u{1F3BE}"}];let notificationIndex=0;const showNotification=()=>{const notification=notifications[notificationIndex%notifications.length],notifElement=document.createElement("div");notifElement.className="notification-badge",notifElement.innerHTML=`
        <div class="notification-icon">${notification.icon}</div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-text">${notification.text}</div>
        </div>
      `,document.body.appendChild(notifElement),setTimeout(()=>notifElement.classList.add("show"),100),setTimeout(()=>{notifElement.classList.remove("show"),setTimeout(()=>notifElement.remove(),500)},4e3),notificationIndex++};setTimeout(showNotification,5e3),setInterval(showNotification,3e4)}initFloatingActionButton(){document.body.insertAdjacentHTML("beforeend",`
      <div class="fab-container">
        <button class="fab" aria-label="Quick Actions">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        <div class="fab-menu">
          <button class="fab-menu-item" data-action="chat" aria-label="Chat">\u{1F4AC}</button>
          <button class="fab-menu-item" data-action="call" aria-label="Call">\u{1F4DE}</button>
          <button class="fab-menu-item" data-action="help" aria-label="Help">\u2753</button>
        </div>
      </div>
    `);const fab=document.querySelector(".fab"),fabMenu=document.querySelector(".fab-menu");fab.addEventListener("click",()=>{fab.classList.toggle("active"),fabMenu.classList.toggle("active")}),document.querySelectorAll(".fab-menu-item").forEach(item=>{item.addEventListener("click",()=>{const action=item.dataset.action;this.handleFabAction(action)})})}handleFabAction(action){switch(action){case"chat":console.log("Opening chat...");break;case"call":alert("Call us: 1-800-TICKETS");break;case"help":window.location.href="/pages/faq";break}}initDarkMode(){const darkModeToggle=document.createElement("button");darkModeToggle.className="dark-mode-toggle",darkModeToggle.innerHTML="\u{1F319}",darkModeToggle.setAttribute("aria-label","Toggle dark mode"),darkModeToggle.style.cssText=`
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `,document.body.appendChild(darkModeToggle),localStorage.getItem("darkMode")==="true"&&(document.body.classList.add("dark-mode"),darkModeToggle.innerHTML="\u2600\uFE0F"),darkModeToggle.addEventListener("click",()=>{document.body.classList.toggle("dark-mode");const isDark=document.body.classList.contains("dark-mode");darkModeToggle.innerHTML=isDark?"\u2600\uFE0F":"\u{1F319}",localStorage.setItem("darkMode",isDark),darkModeToggle.style.transform="rotate(360deg)",setTimeout(()=>{darkModeToggle.style.transform="rotate(0deg)"},300)})}initLoadingStates(){document.querySelectorAll("[data-lazy-load]").forEach(container=>{const skeleton=this.createSkeletonLoader();container.appendChild(skeleton),setTimeout(()=>{skeleton.remove(),container.classList.add("loaded")},1500)})}createSkeletonLoader(){const skeleton=document.createElement("div");return skeleton.className="skeleton-loader",skeleton.innerHTML=`
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 80%;"></div>
    `,skeleton}initTrustBadges(){const script=document.querySelector('script[src*="modern-interactions.js"]'),badges=[{icon:"\u2713",title:script?.dataset?.trustGuaranteed||"100% Guaranteed",desc:script?.dataset?.trustAuthentic||"Authentic tickets"},{icon:"\u{1F512}",title:script?.dataset?.trustSecure||"Secure Payment",desc:script?.dataset?.trustSsl||"SSL encrypted"},{icon:"\u2B50",title:script?.dataset?.trustSince||"Trusted Since 2011",desc:script?.dataset?.trustCustomers||"10,000+ happy customers"}],trustSection=document.querySelector(".trust-badges");trustSection&&badges.forEach((badge,index)=>{const badgeElement=document.createElement("div");badgeElement.className="trust-badge",badgeElement.style.animationDelay=`${index*.2}s`,badgeElement.innerHTML=`
        <div class="trust-badge-icon">${badge.icon}</div>
        <div class="trust-badge-title">${badge.title}</div>
        <div class="trust-badge-desc">${badge.desc}</div>
      `,trustSection.appendChild(badgeElement)})}initVideoBackgrounds(){document.querySelectorAll(".hero-video-bg").forEach(video=>{new IntersectionObserver(entries=>{entries.forEach(entry=>{entry.isIntersecting?video.play():video.pause()})}).observe(video),video.addEventListener("loadstart",()=>{video.classList.add("loading")}),video.addEventListener("canplay",()=>{video.classList.remove("loading"),video.classList.add("loaded")})})}initMicroInteractions(){document.querySelectorAll(".btn-premium").forEach(btn=>{btn.addEventListener("mouseenter",function(e){const x=e.pageX-this.offsetLeft,y=e.pageY-this.offsetTop,ripple=document.createElement("span");ripple.style.left=`${x}px`,ripple.style.top=`${y}px`,ripple.className="btn-ripple",this.appendChild(ripple),setTimeout(()=>ripple.remove(),1e3)})}),document.querySelectorAll("input, textarea").forEach(input=>{input.addEventListener("focus",function(){this.parentElement.classList.add("input-focused")}),input.addEventListener("blur",function(){this.parentElement.classList.remove("input-focused")})}),document.querySelectorAll('a[href^="#"]').forEach(anchor=>{anchor.addEventListener("click",function(e){e.preventDefault();const target=document.querySelector(this.getAttribute("href"));target&&target.scrollIntoView({behavior:"smooth",block:"start"})})})}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{new GoalTicketsEnhancements}):new GoalTicketsEnhancements,window.GoalTicketsEnhancements=GoalTicketsEnhancements;
//# sourceMappingURL=/cdn/shop/t/24/assets/modern-interactions.js.map?v=623238433866371331758253504
