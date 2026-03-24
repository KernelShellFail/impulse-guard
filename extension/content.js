let hourlyRate = 500;
let currentProductPrice = 0;

// Load hourly rate from storage on page load
chrome.storage.sync.get(['hourlyRate'], (result) => {
  if (result.hourlyRate) {
    hourlyRate = result.hourlyRate;
  }
});

// Listen for changes to the hourly rate so it updates without needing a page refresh
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.hourlyRate) {
    hourlyRate = changes.hourlyRate.newValue;
  }
});

// Detect if an element or its parents is a checkout button
function isCheckoutButton(element) {
  let current = element;
  while (current && current !== document.body && current !== document) {
    if (current.tagName === 'BUTTON' || current.tagName === 'A' || current.tagName === 'INPUT') {
      const text = (current.innerText || current.value || current.title || '').toLowerCase();
      const id = (current.id || '').toLowerCase();
      const name = (current.name || '').toLowerCase();
      
      if (
        text.includes('buy now') || 
        text.includes('buy') ||
        text.includes('checkout') || 
        text.includes('place order') ||
        text.includes('add to cart') ||
        id.includes('buy-now') ||
        id.includes('add-to-cart') ||
        name.includes('proceedtoretailcheckout') ||
        name.includes('submit.add-to-cart') ||
        name.includes('submit.buy-now')
      ) {
        return current;
      }
    }
    current = current.parentElement;
  }
  return null;
}

// Extract price from the page
function extractPrice() {
  // Look for common price elements, prioritizing the main buy box on Amazon
  const selectors = [
    '.priceToPay .a-price-whole',
    '.apex-pricetopay-value .a-price-whole',
    '.priceToPay',
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#corePrice_desktop .a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price .a-offscreen',
    '.a-color-price',
    '.price'
  ];
  
  for (let selector of selectors) {
    const priceElements = document.querySelectorAll(selector);
    for (let el of priceElements) {
      // Explicitly ignore M.R.P. (basis price) elements so we only get the discounted price
      if (el.closest('.basisPrice') || el.closest('.apex-basisprice-value') || el.closest('[data-a-strike="true"]')) {
        continue;
      }

      const text = el.innerText || el.textContent;
      // Match ₹, INR, Rs, $, and numbers with commas
      const match = text.match(/(?:₹|INR|Rs\.?|\$)?\s*([\d,]+(\.\d{1,2})?)/i);
      if (match && match[1]) {
        const cleanPrice = match[1].replace(/,/g, '');
        const parsed = parseFloat(cleanPrice);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
  }
  return 0; // Return 0 if not found
}

// Periodically check and store the price to handle variant changes
function updateStoredPrice() {
  const price = extractPrice();
  if (price > 0 && price !== currentProductPrice) {
    currentProductPrice = price;
    // Store it in local storage so it persists across refreshes
    chrome.storage.local.set({ lastSeenPrice: currentProductPrice });
    console.log("Impulse Guard: Product price updated to ₹" + currentProductPrice);
  }
}

// Check price on load and every 1.5 seconds (handles dynamic variant changes)
updateStoredPrice();
setInterval(updateStoredPrice, 1500);

// Show friction popup
function showFrictionModal(originalEvent, button) {
  originalEvent.preventDefault();
  originalEvent.stopPropagation();
  originalEvent.stopImmediatePropagation(); // Important for Amazon

  if (document.getElementById('impulse-guard-modal')) return;

  // Use the continuously tracked price, fallback to extracting it now, fallback to 500
  const price = currentProductPrice > 0 ? currentProductPrice : (extractPrice() || 500);
  const workHours = (price / hourlyRate).toFixed(1);
  
  const title = document.getElementById('productTitle')?.innerText?.trim() || document.title;
  const url = window.location.href;

  const modal = document.createElement('div');
  modal.id = 'impulse-guard-modal';

  const content = document.createElement('div');
  content.id = 'impulse-guard-content';

  content.innerHTML = `
    <h2>Hold on!</h2>
    <p>You are about to spend <strong>₹${price}</strong>.</p>
    <p>That's <strong>${workHours} hours</strong> of your life working.</p>
    
    <div id="ig-ai-analysis">
      <p id="ig-api-message">🤖 AI is analyzing this product...</p>
      <div id="ig-pros-cons" style="display: none;">
        <div class="ig-pros"><strong>Pros:</strong><ul id="ig-pros-list"></ul></div>
        <div class="ig-cons"><strong>Cons:</strong><ul id="ig-cons-list"></ul></div>
      </div>
    </div>

    <div id="impulse-guard-actions">
      <button class="ig-btn ig-btn-cancel" id="ig-cancel">Cancel Purchase</button>
      <button class="ig-btn ig-btn-continue" id="ig-continue" disabled>Continue (Wait <span id="ig-timer">...</span>s)</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  let timer = 0;
  let interval = null;
  const timerEl = document.getElementById('ig-timer');
  const continueBtn = document.getElementById('ig-continue');
  const cancelBtn = document.getElementById('ig-cancel');
  const msgEl = document.getElementById('ig-api-message');

  // Call API
  // Using localhost for local testing
  const backendUrl = 'http://localhost:3000';

  fetch(`${backendUrl}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price, hourlyRate, title, url })
  })
  .then(res => res.json())
  .then(data => {
    msgEl.innerText = data.message;
    
    if (data.pros && data.cons) {
      document.getElementById('ig-pros-cons').style.display = 'flex';
      
      const prosList = document.getElementById('ig-pros-list');
      data.pros.forEach(p => { const li = document.createElement('li'); li.innerText = p; prosList.appendChild(li); });
      
      const consList = document.getElementById('ig-cons-list');
      data.cons.forEach(c => { const li = document.createElement('li'); li.innerText = c; consList.appendChild(li); });
    }

    timer = data.timer || 10;
    timerEl.innerText = timer;
    
    // Start timer only after AI responds
    interval = setInterval(() => {
      timer--;
      if (timer > 0) {
        timerEl.innerText = timer;
      } else {
        clearInterval(interval);
        continueBtn.disabled = false;
        continueBtn.innerText = 'Continue Purchase';
      }
    }, 1000);
  })
  .catch(err => {
    console.error('Impulse Guard API Error:', err);
    msgEl.innerText = 'Take a deep breath. Do you really need this?';
    timer = 10;
    timerEl.innerText = timer;
    
    interval = setInterval(() => {
      timer--;
      if (timer > 0) {
        timerEl.innerText = timer;
      } else {
        clearInterval(interval);
        continueBtn.disabled = false;
        continueBtn.innerText = 'Continue Purchase';
      }
    }, 1000);
  });

  // Resume Flow: Cancel
  cancelBtn.addEventListener('click', () => {
    if (interval) clearInterval(interval);
    modal.remove();
  });

  // Resume Flow: Continue
  continueBtn.addEventListener('click', () => {
    if (interval) clearInterval(interval);
    modal.remove();
    // Temporarily disable our listener to allow the real click
    button.dataset.igBypass = "true";
    button.click();
  });
}

// Global click listener using event delegation in the capture phase
document.addEventListener('click', (e) => {
  const btn = isCheckoutButton(e.target);
  if (btn) {
    if (btn.dataset.igBypass === "true") {
      btn.dataset.igBypass = "false"; // reset
      return; // let it pass
    }
    showFrictionModal(e, btn);
  }
}, true);
