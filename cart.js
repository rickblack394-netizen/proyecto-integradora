// Cart functionality (uses localStorage). Works across pages.
(function(){
  const CART_KEY = 'ecobeauty_cart';
  let cart = [];
  const modalEl = () => document.getElementById('ecCartModal');
  const bsModal = () => modalEl() ? new bootstrap.Modal(modalEl()) : null;

  function loadCart(){
    try{ cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ cart = []; localStorage.removeItem(CART_KEY); }
  }
  function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }
  function formatCurrency(n){ return Number(n || 0).toLocaleString('es-MX',{style:'currency',currency:'MXN'}); }

  function updateCartBadge(){
    const cnt = cart.reduce((s,i)=> s + (i.qty||0), 0);
    document.querySelectorAll('.ec-cart-badge').forEach(b=> b.textContent = cnt);
  }

  function findItem(id){ return cart.find(i=> i.id === id); }

  function addToCart(product){
    // product: {id, name, price}
    if(!product || !product.id) return;
    const existing = findItem(product.id);
    if(existing){ existing.qty = (existing.qty||1) + 1; }
    else { cart.push({ id: product.id, name: product.name, price: Number(product.price||0), qty: 1 }); }
    saveCart(); showToast(`${product.name} agregado al carrito`);
  }

  function removeFromCart(id){ cart = cart.filter(i=> i.id !== id); saveCart(); renderCart(); }
  function setQty(id, qty){ const it = findItem(id); if(!it) return; it.qty = Math.max(0, Math.floor(qty)); if(it.qty===0) removeFromCart(id); else saveCart(); renderCart(); }
  function clearCart(){ cart = []; saveCart(); renderCart(); }

  function cartTotal(){ return cart.reduce((s,i)=> s + (i.price * (i.qty||0)), 0); }

  function renderCart(){
    const container = document.getElementById('ecCartItems');
    if(!container) return;
    container.innerHTML = '';
    if(!cart.length){ container.innerHTML = '<div class="cart-empty">Tu carrito está vacío</div>'; document.getElementById('ecCartTotal').textContent = formatCurrency(0); return; }
    cart.forEach(item=>{
      const div = document.createElement('div'); div.className = 'cart-item d-flex align-items-center justify-content-between';
      div.innerHTML = `
        <div style="flex:1">
          <div class="item-title">${escapeHtml(item.name)}</div>
          <div class="text-muted small">${formatCurrency(item.price)} c/u</div>
        </div>
        <div class="text-end ms-3">
          <div class="qty-controls mb-1">
            <button class="btn btn-sm btn-outline-secondary ec-decr" data-id="${item.id}">-</button>
            <span class="px-2">${item.qty}</span>
            <button class="btn btn-sm btn-outline-secondary ec-incr" data-id="${item.id}">+</button>
          </div>
          <div class="small text-muted">${formatCurrency(item.price * item.qty)}</div>
          <div><button class="btn btn-sm btn-link text-danger ec-remove" data-id="${item.id}">Eliminar</button></div>
        </div>
      `;
      container.appendChild(div);
    });
    document.getElementById('ecCartTotal').textContent = formatCurrency(cartTotal());
    // attach handlers
    container.querySelectorAll('.ec-incr').forEach(b=> b.addEventListener('click', e=> { const id = e.currentTarget.dataset.id; setQty(id, (findItem(id).qty||1) + 1); }));
    container.querySelectorAll('.ec-decr').forEach(b=> b.addEventListener('click', e=> { const id = e.currentTarget.dataset.id; setQty(id, (findItem(id).qty||1) - 1); }));
    container.querySelectorAll('.ec-remove').forEach(b=> b.addEventListener('click', e=> { const id = e.currentTarget.dataset.id; removeFromCart(id); }));
  }

  function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function showToast(msg, type='success'){
    const toast = document.createElement('div'); toast.className = `toast align-items-center text-bg-${type} position-fixed top-0 end-0 m-3`; toast.setAttribute('role','alert'); toast.setAttribute('aria-live','assertive'); toast.setAttribute('aria-atomic','true');
    toast.style.zIndex = 1200;
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${escapeHtml(msg)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    document.body.appendChild(toast);
    const bs = new bootstrap.Toast(toast); bs.show(); setTimeout(()=> toast.remove(), 3000);
  }

  // wire add-to-cart buttons
  function attachAddButtons(){
    document.querySelectorAll('.add-to-cart').forEach(btn=>{
      if(btn._ecAttached) return; btn._ecAttached = true;
      btn.addEventListener('click', (e)=>{
        const id = btn.dataset.id || btn.getAttribute('data-id') || (btn.dataset.name || btn.textContent).trim();
        const name = btn.dataset.name || btn.getAttribute('data-name') || document.title;
        const price = Number(btn.dataset.price || btn.getAttribute('data-price') || 0);
        addToCart({ id, name, price });
      });
    });
  }

  // open cart modal
  function openCart(){ const m = bsModal(); if(!m) return; renderCart(); m.show(); }

  // events for cart button and checkout
  function attachUI(){
    document.querySelectorAll('.ec-open-cart').forEach(b=> b.addEventListener('click', openCart));
    const checkout = document.getElementById('ecCheckoutBtn'); if(checkout) checkout.addEventListener('click', ()=>{
      if(!cart.length){ showToast('El carrito está vacío', 'warning'); return; }
      // placeholder checkout
      showToast('Compra simulada. Gracias por tu compra', 'success');
      clearCart(); const m = bsModal(); if(m) m.hide();
    });
    const clearBtn = document.getElementById('ecClearCartBtn'); if(clearBtn) clearBtn.addEventListener('click', ()=>{ if(confirm('Vaciar el carrito?')){ clearCart(); }});
  }

  // initialize
  document.addEventListener('DOMContentLoaded', ()=>{
    loadCart(); updateCartBadge(); attachAddButtons(); attachUI();
    // re-run attachAddButtons periodically (in pages that dynamically inject products)
    const observer = new MutationObserver(()=> attachAddButtons());
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // expose small API
  window.ecobeautyCart = { addToCart, removeFromCart, setQty, clearCart, openCart };
})();
