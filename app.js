// --- Data Model ---
let tableId = 12;
let userName = "You";
let orderItems = [
  // Food
  { id: 1, name: "Klassischer Burger", price: 6.00, quantity: 2, paidQuantity: 0, paidBy: null, description: "Klassischer Cheeseburger aus Rindfleisch mit einer Sauce", icon: "fas fa-hamburger" },
  { id: 2, name: "Bowl mit Poulet", price: 8.00, quantity: 2, paidQuantity: 0, paidBy: null, description: "1 Basis & 2 Beilagen", icon: "fas fa-bowl-food" },
  // Drinks
  { id: 3, name: "Coca-Cola", price: 2.00, quantity: 3, paidQuantity: 0, paidBy: null, description: "Coca-Cola", icon: "fas fa-glass-martini-alt" },
  { id: 4, name: "Valser Wasser - Still", price: 5.00, quantity: 2, paidQuantity: 0, paidBy: null, description: "Valser Wasser - Still", icon: "fas fa-tint" },
  { id: 5, name: "Valser mit", price: 5.00, quantity: 2, paidQuantity: 0, paidBy: null, description: "Valser mit", icon: "fas fa-tint" },
  { id: 6, name: "Fanta Orange", price: 2.00, quantity: 2, paidQuantity: 0, paidBy: null, description: "Fanta Orange", icon: "fas fa-glass-martini-alt" },
  { id: 7, name: "Fusetea Black - Lemon", price: 2.00, quantity: 2, paidQuantity: 0, paidBy: null, description: "Fusetea Black - Lemon", icon: "fas fa-mug-hot" },
  { id: 8, name: "El Tony Mate", price: 2.00, quantity: 2, paidQuantity: 0, paidBy: null, description: "El Tony Mate", icon: "fas fa-mug-hot" },
  { id: 9, name: "Rivella Blau", price: 5.00, quantity: 2, paidQuantity: 0, paidBy: null, description: "Rivella Blau", icon: "fas fa-wine-bottle" },
  { id: 10, name: "Rivella Rot", price: 5.00, quantity: 2, paidQuantity: 0, paidBy: null, description: "Rivella Rot", icon: "fas fa-wine-bottle" },
  // Golf Fee
  { id: 11, name: "Golf Fee", price: 25.00, quantity: 5, paidQuantity: 0, paidBy: null, description: "Per person golf course fee", icon: "fas fa-golf-ball" }
];
let selectedItems = []; // Will store {id: itemId, quantity: selectedQty}
let selectedTip = 0;
let customTip = '';
let email = '';
let payerName = '';
let selectedCategory = ''; // NEW: Track selected category
let screen = 1; // 1:Checkout, 2:Table Home, 3:Select Pay, 4:Confirm, 5:Closed
let lastPaidItems = [];
let lastTip = 0;
let paymentMethod = 'table'; // 'now' or 'table'
let isLoading = false;

// --- Utility Functions ---
function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CHF'
  }).format(n);
}

function getUnpaidItems() {
  return orderItems.filter(i => i.paidQuantity < i.quantity);
}

function getPaidItems() {
  return orderItems.filter(i => i.paidQuantity > 0);
}

function getSelectedTotal() {
  let total = selectedItems.reduce((sum, selection) => {
    let item = orderItems.find(i => i.id === selection.id);
    return sum + (item ? item.price * selection.quantity : 0);
  }, 0);
  let tip = selectedTip === 'custom' ? parseFloat(customTip) || 0 : (selectedTip * total);
  return total + tip;
}

function allPaid() {
  return orderItems.every(i => i.paidQuantity >= i.quantity);
}

function getUnpaidQuantity(item) {
  return item.quantity - item.paidQuantity;
}

function isItemFullyPaid(item) {
  return item.paidQuantity >= item.quantity;
}

function getSelectedQuantity(itemId) {
  let selection = selectedItems.find(s => s.id === itemId);
  return selection ? selection.quantity : 0;
}

function showLoading() {
  isLoading = true;
  render();
}

function hideLoading() {
  isLoading = false;
  render();
}

// --- Render Functions ---
function render() {
  let html = '';
  if (screen === 1) html = renderCheckout();
  if (screen === 2) html = renderTableHome();
  if (screen === 3) html = renderSelectPay();
  if (screen === 4) html = renderConfirmation();
  if (screen === 5) html = renderClosed();
  
  const app = document.getElementById('app');
  app.innerHTML = html;
}

function renderCheckout() {
  return `
    <h1><i class="fas fa-credit-card" style="margin-right: 12px; color: var(--primary);"></i>Checkout</h1>
    <h2>How would you like to pay for your order?</h2>
    <div class="radio-group">
      <label class="radio-label" onclick="selectPaymentMethod('now')">
        <span class="radio${paymentMethod === 'now' ? ' selected' : ''}"></span>
        <div class="radio-text">
          <div><i class="fas fa-bolt" style="margin-right: 8px; color: var(--primary);"></i>Pay Now</div>
          <div class="radio-description">Complete payment immediately</div>
        </div>
      </label>
      <label class="radio-label" onclick="selectPaymentMethod('table')">
        <span class="radio${paymentMethod === 'table' ? ' selected' : ''}"></span>
        <div class="radio-text">
          <div><i class="fas fa-table" style="margin-right: 8px; color: var(--primary);"></i>Pay at the Table</div>
          <div class="radio-description">Pay when you're ready, right from your table</div>
        </div>
      </label>
    </div>
    <button class="button" onclick="continueToTable()" ${isLoading ? 'disabled' : ''}>
      ${isLoading ? '<span class="loading"></span> Loading...' : 'Continue'}
    </button>
  `;
}

function renderTableHome() {
  const unpaidCount = getUnpaidItems().length;
  const paidCount = getPaidItems().length;
  
  return `
    <h1><i class="fas fa-chair" style="margin-right: 12px; color: var(--primary);"></i>Table ${tableId}</h1>
    <h2>Welcome! Here's your current order status.</h2>
    
    ${unpaidCount > 0 ? `
      <div class="info">
        <i class="fas fa-clock"></i>
        ${unpaidCount} item${unpaidCount > 1 ? 's' : ''} pending payment
      </div>
    ` : ''}
    
    <ul class="order-list">
      ${orderItems.map(item => {
        const unpaidQty = getUnpaidQuantity(item);
        const paidQty = item.paidQuantity;
        const totalQty = item.quantity;
        
        return `
          <li class="order-card">
            <div class="order-info">
              <span class="order-name">
                <i class="${item.icon}"></i>
                ${item.name}
              </span>
              <span class="order-price">
                ${formatMoney(item.price)} each × ${totalQty} = ${formatMoney(item.price * totalQty)}
                ${paidQty > 0 ? `<br><small style="color: var(--success);">${paidQty} paid, ${unpaidQty} remaining</small>` : ''}
              </span>
            </div>
            <span class="status-tag ${paidQty > 0 ? 'paid' : 'unpaid'}">
              <i class="fas fa-${paidQty > 0 ? 'check' : 'clock'}" style="margin-right: 4px;"></i>
              ${paidQty > 0 ? `${paidQty}/${totalQty} Paid` : 'Unpaid'}
            </span>
          </li>
        `;
      }).join('')}
    </ul>
    
    <button class="button secondary" onclick="orderMore()">
      <i class="fas fa-plus" style="margin-right: 8px;"></i>Order More
    </button>
    <button class="button" onclick="goToPayment()" ${allPaid() ? 'disabled' : ''}>
      <i class="fas fa-credit-card" style="margin-right: 8px;"></i>
      Pay Now ${unpaidCount > 0 ? `(${unpaidCount} items)` : ''}
    </button>
    
    ${allPaid() ? `
      <div class="close-cart success-animation">
        <i class="fas fa-check-circle"></i>
        All items paid!<br>
        <small>Staff have been notified</small>
      </div>
    ` : ''}
  `;
}

function renderSelectPay() {
  // Group items by payment status
  const unpaid = orderItems.filter(i => i.paidQuantity === 0);
  const partial = orderItems.filter(i => i.paidQuantity > 0 && i.paidQuantity < i.quantity);
  const paid = orderItems.filter(i => i.paidQuantity === i.quantity);

  // Get unique categories from items
  const categories = [...new Set(orderItems.map(item => {
    if (item.name.includes('Golf')) return 'Golf Fees';
    if (item.name.includes('Beer') || item.name.includes('Coca') || item.name.includes('Sprite') || 
        item.name.includes('Diet') || item.name.includes('Lemonade') || item.name.includes('Tea') || 
        item.name.includes('Coffee') || item.name.includes('Juice') || item.name.includes('Water')) {
      return 'Drinks';
    }
    return 'Other';
  }))];

  // Quick pay button handlers
  function quickSelect(percent) {
    selectedItems = [];
    const items = [...unpaid, ...partial];
    
    // If a category is selected, filter by that category
    let filteredItems = items;
    if (selectedCategory) {
      filteredItems = items.filter(item => {
        let itemCategory = '';
        if (item.name.includes('Golf')) itemCategory = 'Golf Fees';
        else if (item.name.includes('Beer') || item.name.includes('Coca') || item.name.includes('Sprite') || 
                 item.name.includes('Diet') || item.name.includes('Lemonade') || item.name.includes('Tea') || 
                 item.name.includes('Coffee') || item.name.includes('Juice') || item.name.includes('Water')) {
          itemCategory = 'Drinks';
        } else {
          itemCategory = 'Other';
        }
        return itemCategory === selectedCategory;
      });
    }
    
    let totalUnpaid = filteredItems.reduce((sum, item) => sum + (item.quantity - item.paidQuantity), 0);
    let toPay = percent === 1 ? totalUnpaid : Math.floor(totalUnpaid * percent);
    filteredItems.forEach(item => {
      let available = item.quantity - item.paidQuantity;
      if (toPay > 0) {
        let qty = Math.min(available, toPay);
        if (qty > 0) selectedItems.push({ id: item.id, quantity: qty });
        toPay -= qty;
      }
    });
    render();
  }

  // Category selection handler
  function selectCategory(category) {
    selectedCategory = selectedCategory === category ? '' : category; // Toggle selection
    selectedItems = []; // Clear current selection
    render();
  }

  // Expose for inline use
  window.quickSelect = quickSelect;
  window.selectCategory = selectCategory;

  // Category filters
  const categoryFilters = `
    <div class="category-filters">
      <div class="filter-section">
        <h4>Select Category:</h4>
        <div class="filter-buttons">
          <button class="filter-btn ${selectedCategory === 'Drinks' ? 'active' : ''}" onclick="selectCategory('Drinks')">
            <i class="fas fa-glass-martini-alt"></i> Drinks
          </button>
          <button class="filter-btn ${selectedCategory === 'Golf Fees' ? 'active' : ''}" onclick="selectCategory('Golf Fees')">
            <i class="fas fa-golf-ball"></i> Golf Fees
          </button>
          <button class="filter-btn ${selectedCategory === 'Other' ? 'active' : ''}" onclick="selectCategory('Other')">
            <i class="fas fa-utensils"></i> Other
          </button>
        </div>
      </div>
      
      <div class="filter-section">
        <h4>Quick Pay ${selectedCategory ? `(${selectedCategory})` : '(All Items)'}:</h4>
        <div class="filter-buttons">
          <button class="filter-btn" onclick="quickSelect(1)">
            <i class="fas fa-check-circle"></i> Pay All
          </button>
          <button class="filter-btn" onclick="quickSelect(0.5)">
            <i class="fas fa-percentage"></i> Pay 50%
          </button>
          <button class="filter-btn" onclick="quickSelect(0.2)">
            <i class="fas fa-percentage"></i> Pay 20%
          </button>
        </div>
      </div>
    </div>
  `;

  return `
    <h1><i class="fas fa-shopping-cart" style="margin-right: 12px; color: var(--primary);"></i>Select Items</h1>
    <h2>Choose which items and quantities you'd like to pay for.</h2>
    
    ${(unpaid.length + partial.length) > 0 ? `
      <div class="info">
        <i class="fas fa-info-circle"></i>
        Select items and quantities to pay for
      </div>
      
      ${categoryFilters}
    ` : ''}
    
    <ul class="order-list">
      ${[...unpaid, ...partial].map(item => {
        const unpaidQty = getUnpaidQuantity(item);
        const selectedQty = getSelectedQuantity(item.id);
        const totalQty = item.quantity;
        const paidQty = item.paidQuantity;
        
        return `
          <li class="order-card">
            <div class="order-info" style="flex: 1; min-width: 0;">
              <span class="order-name">
                <i class="${item.icon}"></i>
                ${item.name}
              </span>
              <span class="order-price">
                ${formatMoney(item.price)} each
                <br><small style="color: var(--text-secondary);">${paidQty} paid, ${unpaidQty} available</small>
              </span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; min-width: 110px;">
              <div class="quantity-controls" style="flex-direction: row; align-items: center; gap: 8px; justify-content: flex-end;">
                <button class="quantity-btn" onclick="decreaseQuantity(${item.id})" ${selectedQty <= 0 ? 'disabled' : ''}>-</button>
                <span class="quantity-display">${selectedQty}</span>
                <button class="quantity-btn" onclick="increaseQuantity(${item.id})" ${selectedQty >= unpaidQty ? 'disabled' : ''}>+</button>
              </div>
              ${selectedQty > 0 ? `<div style='margin-top: 4px; font-size: 1rem; color: var(--success); font-weight: 600; text-align: right;'>${formatMoney(item.price * selectedQty)}</div>` : ''}
            </div>
          </li>
        `;
      }).join('')}
      
      ${paid.map(item => `
        <li class="order-card" style="opacity: 0.7;">
          <div class="order-info">
            <span class="order-name">
              <i class="${item.icon}"></i>
              ${item.name}
            </span>
            <span class="order-price">
              ${formatMoney(item.price)} each × ${item.quantity} = ${formatMoney(item.price * item.quantity)}
              <br><small style="color: var(--success);">${item.paidQuantity} paid</small>
            </span>
          </div>
          <span class="status-tag paid">
            <i class="fas fa-check" style="margin-right: 4px;"></i>Fully Paid
          </span>
        </li>
      `).join('')}
    </ul>
    
    ${selectedItems.length > 0 ? `
      <div class="payment-form">
        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-user" style="margin-right: 8px; color: var(--primary);"></i>
            Who is paying? (optional)
          </label>
          <input type="text" class="form-input" placeholder="Enter your name" value="${payerName}" oninput="payerName=this.value">
        </div>
      </div>
      
      <div class="info">
        <i class="fas fa-percentage"></i>
        Add a tip (optional)
      </div>
      <div class="tip-selector">
        <button class="tip-btn${selectedTip===0.1?' selected':''}" onclick="selectTip(0.1)">10%</button>
        <button class="tip-btn${selectedTip===0.15?' selected':''}" onclick="selectTip(0.15)">15%</button>
        <button class="tip-btn${selectedTip===0.2?' selected':''}" onclick="selectTip(0.2)">20%</button>
        <button class="tip-btn${selectedTip==='custom'?' selected':''}" onclick="selectTip('custom')">Custom</button>
      </div>
      
      ${selectedTip==='custom' ? `
        <div class="input-row">
          <input type="number" min="0" step="0.01" placeholder="Enter tip amount" value="${customTip}" oninput="customTip=this.value;render()">
        </div>
      ` : ''}
    ` : ''}
    
    <button class="button" onclick="paySelected()" ${selectedItems.length===0?'disabled':''}>
      <i class="fas fa-credit-card" style="margin-right: 8px;"></i>
      Pay ${selectedItems.length>0?formatMoney(getSelectedTotal()):''}
    </button>
    <button class="button secondary" onclick="goBack()">
      <i class="fas fa-arrow-left" style="margin-right: 8px;"></i>Back
    </button>
  `;
}

function renderConfirmation() {
  let paidItems = lastPaidItems;
  let tip = lastTip;
  let subtotal = paidItems.reduce((sum, item) => sum + (item.price * item.paidQuantity), 0);
  let total = subtotal + tip;
  
  return `
    <h1><i class="fas fa-check-circle" style="margin-right: 12px; color: var(--success);"></i>Payment Successful!</h1>
    <h2>Here's your receipt for this payment.</h2>
    
    ${payerName ? `
      <div class="info">
        <i class="fas fa-user"></i>
        Paid by: ${payerName}
      </div>
    ` : ''}
    
    <ul class="receipt-list">
      ${paidItems.map(item => `
        <li class="receipt-item">
          <span><i class="${item.icon}" style="margin-right: 8px; color: var(--primary);"></i>${item.name} × ${item.paidQuantity}</span>
          <span>${formatMoney(item.price * item.paidQuantity)}</span>
        </li>
      `).join('')}
      
      ${tip > 0 ? `
        <li class="receipt-item">
          <span><i class="fas fa-heart" style="margin-right: 8px; color: var(--primary);"></i>Tip</span>
          <span>${formatMoney(tip)}</span>
        </li>
      ` : ''}
      
      <li class="receipt-total">
        <span>Total</span>
        <span>${formatMoney(total)}</span>
      </li>
    </ul>
    
    <div class="input-row">
      <input type="email" placeholder="Email receipt (optional)" value="${email}" oninput="email=this.value">
      <button onclick="sendEmailReceipt()">
        <i class="fas fa-paper-plane" style="margin-right: 4px;"></i>Send
      </button>
    </div>
    
    <button class="button" onclick="goBack()">
      <i class="fas fa-list" style="margin-right: 8px;"></i>Check Order Status
    </button>
  `;
}

function renderClosed() {
  return `
    <h1><i class="fas fa-check-circle" style="margin-right: 12px; color: var(--success);"></i>All Items Paid</h1>
    <h2>Thank you for dining with us!</h2>
    
    <div class="close-cart success-animation">
      <i class="fas fa-check-circle"></i>
      Your cart is closed<br>
      <small>Staff have been notified</small>
    </div>
    
    <button class="button" onclick="resetCart()">
      <i class="fas fa-plus" style="margin-right: 8px;"></i>Order Again
    </button>
  `;
}

// --- Navigation Functions ---
function continueToTable() {
  showLoading();
  setTimeout(() => {
    screen = 2;
    hideLoading();
    render();
  }, 1000);
}

function goToPayment() {
  selectedItems = [];
  selectedTip = 0;
  customTip = '';
  payerName = '';
  screen = 3;
  render();
}

function goBack() {
  screen = 2;
  render();
}

function orderMore() {
  window.location.href = 'https://app.ordermonkey.com/welcome/6447fb68-86a5-4448-ba4f-a54c1dfd99eb/7d818c40a47e4b428d566ab248b822ec';
}

// --- Interaction Handlers ---
function increaseQuantity(id) {
  let item = orderItems.find(i => i.id === id);
  if (!item) return;
  
  let unpaidQty = getUnpaidQuantity(item);
  let currentSelected = getSelectedQuantity(id);
  
  if (currentSelected < unpaidQty) {
    let selection = selectedItems.find(s => s.id === id);
    if (selection) {
      selection.quantity++;
    } else {
      selectedItems.push({id: id, quantity: 1});
    }
    render();
  }
}

function decreaseQuantity(id) {
  let selection = selectedItems.find(s => s.id === id);
  if (selection) {
    selection.quantity--;
    if (selection.quantity <= 0) {
      selectedItems = selectedItems.filter(s => s.id !== id);
    }
    render();
  }
}

function selectTip(val) {
  selectedTip = val;
  if (val !== 'custom') customTip = '';
  render();
}

function paySelected() {
  showLoading();
  
  setTimeout(() => {
    let paid = [];
    for (let selection of selectedItems) {
      let item = orderItems.find(i => i.id === selection.id);
      if (item) {
        let unpaidQty = getUnpaidQuantity(item);
        let toPay = Math.min(selection.quantity, unpaidQty);
        
        if (toPay > 0) {
          item.paidQuantity += toPay;
          item.paidBy = payerName || userName;
          
          // Create a copy for the receipt
          let paidItem = {...item};
          paidItem.paidQuantity = toPay;
          paid.push(paidItem);
        }
      }
    }
    
    lastPaidItems = paid;
    lastTip = selectedTip === 'custom' ? parseFloat(customTip) || 0 : (selectedTip * paid.reduce((sum, i) => sum + (i.price * i.paidQuantity), 0));
    selectedItems = [];
    selectedTip = 0;
    customTip = '';
    payerName = '';
    
    hideLoading();
    screen = allPaid() ? 5 : 4;
    render();
  }, 1500);
}

function sendEmailReceipt() {
  if (!email) {
    alert('Please enter an email address');
    return;
  }
  
  showLoading();
  setTimeout(() => {
    alert(`Receipt sent to ${email}!`);
    email = '';
    hideLoading();
    render();
  }, 1000);
}

function resetCart() {
  orderItems.forEach(i => { 
    i.paidQuantity = 0; 
    i.paidBy = null; 
  });
  screen = 1;
  render();
}

function selectPaymentMethod(method) {
  paymentMethod = method;
  render();
}

// --- Initial Render ---
render();

// Expose functions for inline handlers
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.selectTip = selectTip;
window.paySelected = paySelected;
window.sendEmailReceipt = sendEmailReceipt;
window.resetCart = resetCart;
window.selectPaymentMethod = selectPaymentMethod;
window.continueToTable = continueToTable;
window.goToPayment = goToPayment;
window.goBack = goBack;
window.orderMore = orderMore; 