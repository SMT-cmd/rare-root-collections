// ------------------------------------------------
// 1. DATABASE & STATE
// ------------------------------------------------
let products = [];
let cart = [];
let currentModalProduct = null;

// Fetch Products from JSON (Simulating Database)
async function fetchProducts() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        products = data.products || [];
        initializeShop();
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading shop inventory.');
    }
}

function initializeShop() {
    // Render all categories
    const categories = [...new Set(products.map(p => p.category))];
    
    // Clear existing grids first (in case of re-init)
    document.querySelectorAll('.grid').forEach(grid => grid.innerHTML = '');

    // If we have specific grids in HTML, render to them
    renderCategory("Gym Wear for Traders", "exchange-grid");
    renderCategory("Street Wear", "kinetic-grid");
    renderCategory("Brand Casuals", "urban-grid");
    
    // Also render others if they exist in data but not explicitly in HTML structure
    // (Future proofing: dynamic category creation could go here)
}

// ------------------------------------------------
// 2. RENDERING
// ------------------------------------------------
function renderCategory(categoryName, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return; 
    
    // Filter by category and ensure not hidden
    const items = products.filter(p => p.category === categoryName && !p.hidden);
    
    if (items.length === 0) {
        // Optional: Hide section if empty
        // container.previousElementSibling.style.display = 'none';
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; opacity:0.5;">Coming Soon</p>';
        return;
    }

    container.innerHTML = ''; // Clear current content
    
    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const isSale = product.sale_price && product.sale_price < product.price;
        const priceDisplay = isSale 
            ? `<span class="original-price">₦${product.price.toLocaleString()}</span> <span class="sale-price">₦${product.sale_price.toLocaleString()}</span>` 
            : `₦${product.price.toLocaleString()}`;
        
        const discountBadge = isSale 
            ? `<span class="discount-badge">-${Math.round(((product.price - product.sale_price) / product.price) * 100)}%</span>` 
            : '';

        card.innerHTML = `
            <div class="product-image-container">
                ${discountBadge}
                <img src="${product.img}" alt="${product.name}" loading="lazy">
                <button class="add-to-cart-btn" onclick="openProductModal(${product.id})">
                    Quick View
                </button>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${priceDisplay}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// ------------------------------------------------
// 3. PRODUCT MODAL & SELECTION
// ------------------------------------------------
function openProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    currentModalProduct = product;
    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');

    // Price Logic
    let priceDisplay = `₦${product.price.toLocaleString()}`;
    let actualPrice = product.price;
    if (product.sale_price) {
        priceDisplay = `<span class="old-price">₦${product.price.toLocaleString()}</span> ₦${product.sale_price.toLocaleString()}`;
        actualPrice = product.sale_price;
    }

    // Generate Size Options
    let sizeOptions = product.sizes ? product.sizes.map(s => `<option value="${s}">${s}</option>`).join('') : '<option>One Size</option>';
    
    // Generate Color Options
    let colorOptions = product.colors ? product.colors.map(c => `<option value="${c.color}">${c.color}</option>`).join('') : '<option>Standard</option>';

    modalBody.innerHTML = `
        <div class="modal-left">
            <img src="${product.img}" alt="${product.name}" class="modal-img">
        </div>
        <div class="modal-info">
            <h2>${product.name}</h2>
            <div class="modal-price">${priceDisplay}</div>
            <p style="opacity:0.8; margin-bottom:20px;">${product.description || "Premium quality fabric, designed for the driven."}</p>
            
            <div class="modal-opt-group">
                <label class="modal-opt-label">Size</label>
                <select id="modal-size" class="modal-select">
                    ${sizeOptions}
                </select>
            </div>
            
            <div class="modal-opt-group">
                <label class="modal-opt-label">Color</label>
                <select id="modal-color" class="modal-select">
                    ${colorOptions}
                </select>
            </div>

            <button class="btn-checkout" onclick="addToCartFromModal()">Add to Bag - ₦${actualPrice.toLocaleString()}</button>
        </div>
    `;

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById('product-modal').style.display = "none";
    currentModalProduct = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target == modal) {
        closeModal();
    }
}

function addToCartFromModal() {
    if (!currentModalProduct) return;

    const size = document.getElementById('modal-size').value;
    const color = document.getElementById('modal-color').value;
    const price = currentModalProduct.sale_price || currentModalProduct.price;

    const cartItem = {
        ...currentModalProduct,
        selectedSize: size,
        selectedColor: color,
        finalPrice: price,
        cartId: Date.now() // Unique ID for cart entry
    };

    cart.push(cartItem);
    updateCartUI();
    closeModal();
    showToast(`Added ${currentModalProduct.name} (${size})`);
    toggleCart(); // Open cart to show item
}

// ------------------------------------------------
// 4. CART LOGIC
// ------------------------------------------------
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    // Update Count
    cartCount.innerText = cart.length;

    // Update Items
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">Your bag is empty.</p>';
    } else {
        cart.forEach((item, index) => {
            total += item.finalPrice;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div>
                    <div style="color:white; font-weight:bold;">${item.name}</div>
                    <div style="font-size:0.8rem; color:#888;">${item.selectedSize} | ${item.selectedColor}</div>
                </div>
                <div style="text-align:right;">
                    <div>₦${item.finalPrice.toLocaleString()}</div>
                    <div style="color:#aa4444; font-size:0.8rem; cursor:pointer;" onclick="removeFromCart(${item.cartId})">Remove</div>
                </div>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });
    }

    // Update Total
    cartTotal.innerText = '₦' + total.toLocaleString();
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    updateCartUI();
}

function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('overlay');
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        document.getElementById('menu-drawer').classList.remove('open');
        drawer.classList.add('open');
        overlay.classList.add('active');
    }
}

function toggleMenu() {
    const drawer = document.getElementById('menu-drawer');
    const overlay = document.getElementById('overlay');
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        document.getElementById('cart-drawer').classList.remove('open');
        drawer.classList.add('open');
        overlay.classList.add('active');
    }
}

function closeAllDrawers() {
    document.getElementById('menu-drawer').classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

// ------------------------------------------------
// 5. SEARCH LOGIC
// ------------------------------------------------
function handleSearch(query) {
    const term = query.toLowerCase();
    
    if (!term) {
        // Reset to default view
        initializeShop();
        return;
    }

    // Find all matching products
    const matches = products.filter(p => 
        !p.hidden && (
            p.name.toLowerCase().includes(term) || 
            p.category.toLowerCase().includes(term)
        )
    );

    // Render Search Results (Hi-jack one grid or create a results view)
    // Strategy: Hide all grids, show results in the first one with a title change
    
    // Simplest approach: Filter the existing grids in place? 
    // No, because a search might return items from multiple categories.
    // Better: Clear all grids, and render matches into the first grid (The Exchange) and hide others titles.
    
    document.getElementById('exchange-grid').innerHTML = '';
    document.getElementById('kinetic-grid').innerHTML = '';
    document.getElementById('urban-grid').innerHTML = '';
    
    // Hide headers temporarily (optional, but cleaner)
    document.querySelectorAll('.collection-header').forEach(el => el.style.display = 'none');
    
    // Create a temporary results header if not exists
    let resultsHeader = document.getElementById('search-results-header');
    if (!resultsHeader) {
        resultsHeader = document.createElement('div');
        resultsHeader.id = 'search-results-header';
        resultsHeader.className = 'collection-header';
        resultsHeader.innerHTML = '<h2 class="category-title">Search Results</h2>';
        document.getElementById('exchange-grid').parentNode.insertBefore(resultsHeader, document.getElementById('exchange-grid'));
    }
    resultsHeader.style.display = 'block';

    if (matches.length === 0) {
        document.getElementById('exchange-grid').innerHTML = '<p style="text-align:center; padding:40px;">No products found.</p>';
    } else {
        const container = document.getElementById('exchange-grid');
        matches.forEach(product => {
            // Reuse render logic or copy-paste card creation
            const card = document.createElement('div');
            card.className = 'product-card';
            
            let priceHtml = `₦${product.price.toLocaleString()}`;
            if (product.sale_price) {
                priceHtml = `<span style="text-decoration: line-through; color: #888; font-size: 0.9em; margin-right:5px;">₦${product.price.toLocaleString()}</span> 
                             <span style="color: var(--text-gold);">₦${product.sale_price.toLocaleString()}</span>`;
            }

            card.innerHTML = `
                <div class="p-img-box" onclick="openProductModal(${product.id})">
                    <img src="${product.img}" alt="${product.name}" class="p-img">
                </div>
                <div class="p-info">
                    <h3 class="p-name">${product.name}</h3>
                    <div class="p-price">${priceHtml}</div>
                    <button class="btn-add" onclick="openProductModal(${product.id})">View Options</button>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// Reset view helper (when search is cleared)
document.getElementById('search-input').addEventListener('input', (e) => {
    if (e.target.value === '') {
        document.querySelectorAll('.collection-header').forEach(el => el.style.display = 'block');
        const resultsHeader = document.getElementById('search-results-header');
        if (resultsHeader) resultsHeader.style.display = 'none';
        initializeShop();
    }
});


// ------------------------------------------------
// 6. UTILITIES (Toast, Checkout)
// ------------------------------------------------
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = message;
    toast.className = "toast show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

function checkout() {
    if (cart.length === 0) {
        showToast("Your bag is empty.");
        return;
    }
    let totalAmount = cart.reduce((sum, item) => sum + item.finalPrice, 0);
    let email = prompt("Enter your email for the receipt:");
    if (email) {
        // Simulating Paystack for now
        alert(`Proceeding to payment of ₦${totalAmount.toLocaleString()} for ${email}`);
        // In real integration: PaystackPop.setup({...}).openIframe();
    }
}

// ------------------------------------------------
// INITIALIZATION
// ------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    
    // Initialize Netlify Identity if present
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on("init", user => {
            if (!user) {
                window.netlifyIdentity.on("login", () => {
                    document.location.href = "/admin/";
                });
            }
        });
    }
});
