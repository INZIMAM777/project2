document.addEventListener('DOMContentLoaded', function () {
    // --- Global Variables & Constants ---
    const container = document.getElementById('watch-container');
    const modalContainer = document.getElementById('modal-container');
    let allWatches = [], filteredWatches = [];
    let cart = JSON.parse(localStorage.getItem('watchCart')) || [];

    // --- Initialization ---
    initializePage();

    function initializePage() {
        initializeMenu();
        initializeFilters();
        loadWatchCollection();
        updateCartCount();
    }

    // --- Menu & UI Interactions ---
    function initializeMenu() {
        const navbar = document.getElementById('navbar');
        const menuToggle = document.getElementById('menuToggle');
        const sideMenu = document.getElementById('sideMenu');
        const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
        const filtersSection = document.getElementById('filtersSection');
        const cartIcon = document.getElementById('cartIcon');

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        // Side Menu Toggle
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = menuToggle.classList.toggle('active');
            sideMenu.classList.toggle('active', isActive);
            document.body.classList.toggle('modal-open', isActive);
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sideMenu.contains(e.target) && !menuToggle.contains(e.target) && sideMenu.classList.contains('active')) {
                menuToggle.classList.remove('active');
                sideMenu.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        });
        
        // Filter toggle button logic
        if (toggleFiltersBtn && filtersSection) {
            toggleFiltersBtn.addEventListener('click', () => {
                const isHidden = filtersSection.style.display === 'none' || !filtersSection.style.display;
                filtersSection.style.display = isHidden ? 'block' : 'none';
            });
        }

        // Cart icon click handler
        if (cartIcon) {
            cartIcon.addEventListener('click', () => {
                window.location.href = 'carts&orders.html';
            });
        }
    }

    // --- Data Loading & Rendering ---
    async function loadWatchCollection() {
        try {
            showLoading();
            const response = await fetch('watches1.json'); 
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            allWatches = Array.isArray(data) ? data : (data.watches || []);

            if (allWatches.length === 0) {
                showError("No watches found in the collection.");
                return;
            }
            
            filteredWatches = [...allWatches];
            populateFilterOptions();
            await renderWatches(filteredWatches);

        } catch (error) {
            console.error("Error loading watch collection:", error);
            showError("Failed to load the collection. Please try again.");
        }
    }

    async function renderWatches(watches) {
        container.innerHTML = '';
        if (watches.length === 0) {
            showError("No watches match the current filters.");
            return;
        }
        
        const fragment = document.createDocumentFragment();
        for (const watch of watches) {
            const card = await createWatchCard(watch);
            fragment.appendChild(card);
        }
        container.appendChild(fragment);
    }

    async function createWatchCard(watch) {
        const card = document.createElement('div');
        card.className = 'watch-card';
        const investmentGrade = watch.analytics?.investmentGrade || 'N/A';
        const formattedGrade = investmentGrade.replace('+', '-plus');

        card.innerHTML = `
            <div class="watch-image-container">
                <div class="spinner"></div>
            </div>
            <div class="watch-details">
                <div class="watch-brand">${escapeHtml(watch.brand)}</div>
                <div class="watch-model">${escapeHtml(watch.model)}</div>
                <div class="quick-specs">
                    <div class="spec-item"><span class="spec-label">Case</span>${escapeHtml(watch.caseMaterial)}</div>
                    <div class="spec-item"><span class="spec-label">Size</span>${escapeHtml(watch.caseSize)}mm</div>
                    <div class="spec-item"><span class="spec-label">Water Resistance</span>${escapeHtml(watch.waterResistance)}</div>
                    <div class="spec-item"><span class="spec-label">Dial</span>${escapeHtml(watch.dialColor)}</div>
                </div>
                <div class="card-footer">
                    <div class="watch-price">${formatPrice(watch.price, watch.currency)}</div>
                    <button class="quick-view-btn">Quick View</button>
                </div>
            </div>
            <span class="investment-grade ${formattedGrade}">${investmentGrade}</span>
        `;

        const imageContainer = card.querySelector('.watch-image-container');
        const imageUrl = await getReliableImageUrl(watch);
        updateCardImage(imageContainer, imageUrl, watch);
        
        card.querySelector('.quick-view-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showWatchModal(watch);
        });
        
        return card;
    }

    async function getReliableImageUrl(watch) {
        const sources = [
            watch.image, 
            `https://images.watchfinder.co.uk/images/watch/stock/${watch.reference}.jpg`
        ];
        
        for (const source of sources) {
            if (source && await testImage(source)) return source;
        }
        
        return `https://placehold.co/600x800/1A1A1A/D4AF37/png?text=${encodeURIComponent(watch.brand)}&font=montserrat`;
    }

    function testImage(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    function updateCardImage(container, imageUrl, watch) {
        container.innerHTML = '';
        const img = new Image();
        img.className = 'watch-image';
        img.src = imageUrl;
        img.alt = `${watch.brand} ${watch.model}`;
        img.loading = 'lazy';
        img.onload = () => {
            img.style.opacity = '0';
            container.appendChild(img);
            requestAnimationFrame(() => { img.style.opacity = '1'; });
        };
    }

    // --- Modal Functionality ---
    function showWatchModal(watch) {
    const cartItem = cart.find(item => item.id === watch.id);
    const inCart = Boolean(cartItem);
    const quantity = cartItem?.quantity || 1;
    
    modalContainer.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <img src="${watch.image}" alt="${watch.brand} ${watch.model}" class="modal-image">
                <div class="modal-details">
                    <h2>${escapeHtml(watch.brand)}</h2>
                    <h3>${escapeHtml(watch.model)}</h3>
                    <p class="modal-price">${formatPrice(watch.price, watch.currency)}</p>
                    <p class="modal-description">${escapeHtml(watch.description)}</p>
                    <div class="modal-specs">
                        ${generateSpecItem('Reference', watch.reference)}
                        ${generateSpecItem('Year', watch.year)}
                        ${generateSpecItem('Movement', watch.movement)}
                        ${generateSpecItem('Case Material', watch.caseMaterial)}
                        ${generateSpecItem('Case Size', `${watch.caseSize}mm`)}
                        ${generateSpecItem('Band Material', watch.bandMaterial)}
                        ${generateSpecItem('Dial Color', watch.dialColor)}
                        ${generateSpecItem('Water Resistance', watch.waterResistance)}
                        ${generateSpecItem('Complications', watch.complications?.join(', '))}
                    </div>
                    <div class="modal-actions">
                        ${inCart ? `
                            <div class="quantity-controls">
                                <button class="quantity-btn" id="decreaseQuantity">−</button>
                                <span class="quantity-display">${quantity}</span>
                                <button class="quantity-btn" id="increaseQuantity">+</button>
                            </div>
                        ` : ''}
                        <button class="btn ${inCart ? 'btn-in-cart' : 'btn-add-to-cart'}" 
                                id="modalAddToCart" 
                                data-id="${watch.id}">
                            ${inCart ? '✓ In Cart' : 'Add to Cart'}
                        </button>
                        ${inCart ? '<button class="btn btn-checkout" id="proceedToCheckout">Proceed to Checkout</button>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    const backdrop = modalContainer.querySelector('.modal-backdrop');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => backdrop.classList.add('visible'));

    // Add to cart button in modal
    const addToCartBtn = document.getElementById('modalAddToCart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            if (inCart) return;
            
            cart.push({
                id: watch.id,
                brand: watch.brand,
                model: watch.model,
                price: watch.price,
                currency: watch.currency,
                image: watch.image,
                quantity: 1
            });
            
            saveCart();
            updateCartCount();
            showWatchModal(watch); // Refresh modal to show updated state
            showToast(`${watch.brand} ${watch.model} added to cart`);
        });
    }

    // Quantity controls
    const decreaseBtn = document.getElementById('decreaseQuantity');
    const increaseBtn = document.getElementById('increaseQuantity');
    const quantityDisplay = document.querySelector('.quantity-display');

    if (decreaseBtn && increaseBtn && quantityDisplay) {
        decreaseBtn.addEventListener('click', () => {
            const itemIndex = cart.findIndex(item => item.id === watch.id);
            if (itemIndex !== -1) {
                if (cart[itemIndex].quantity > 1) {
                    cart[itemIndex].quantity--;
                    quantityDisplay.textContent = cart[itemIndex].quantity;
                } else {
                    // Remove item if quantity reaches 0
                    cart.splice(itemIndex, 1);
                    showWatchModal(watch); // Refresh modal
                    showToast(`${watch.brand} ${watch.model} removed from cart`);
                }
                saveCart();
                updateCartCount();
            }
        });

        increaseBtn.addEventListener('click', () => {
            const itemIndex = cart.findIndex(item => item.id === watch.id);
            if (itemIndex !== -1) {
                cart[itemIndex].quantity++;
                quantityDisplay.textContent = cart[itemIndex].quantity;
                saveCart();
                updateCartCount();
            }
        });
    }

    // Proceed to checkout button handler
    const checkoutBtn = document.getElementById('proceedToCheckout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Close the modal first
            backdrop.classList.remove('visible');
            backdrop.addEventListener('transitionend', () => {
                modalContainer.innerHTML = '';
                document.body.classList.remove('modal-open');
                // Then redirect to checkout page
                window.location.href = 'carts&orders.html';
            }, { once: true });
        });
    }

    // Close modal logic
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop || e.target.classList.contains('modal-close')) {
            backdrop.classList.remove('visible');
            backdrop.addEventListener('transitionend', () => {
                modalContainer.innerHTML = '';
                document.body.classList.remove('modal-open');
            }, { once: true });
        }
    });
}
    
    function generateSpecItem(label, value) {
        if (!value) return '';
        return `
            <div class="modal-spec-item">
                <span class="spec-label">${label}</span>
                <span class="spec-value">${escapeHtml(value)}</span>
            </div>
        `;
    }

    // --- Filtering Logic ---
    function initializeFilters() {
        document.querySelectorAll('.filter-select, .filter-input').forEach(input => {
            input.addEventListener('change', applyFilters);
        });
        document.getElementById('resetFilters').addEventListener('click', resetFilters);
    }
    
    function populateFilterOptions() {
        const filters = {
            brands: [...new Set(allWatches.map(w => w.brand))].filter(Boolean).sort(),
            years: [...new Set(allWatches.map(w => w.year))].filter(Boolean).sort((a,b) => b-a),
            movements: [...new Set(allWatches.map(w => w.movement))].filter(Boolean).sort(),
            grades: [...new Set(allWatches.map(w => w.analytics?.investmentGrade))].filter(Boolean).sort(),
        };
        
        populateSelect('brandFilter', filters.brands, 'All Brands');
        populateSelect('yearFilter', filters.years, 'All Years');
        populateSelect('movementFilter', filters.movements, 'All Movements');
        populateSelect('gradeFilter', filters.grades, 'All Grades');
    }

    function applyFilters() {
        const filters = {
            brand: document.getElementById('brandFilter').value,
            minPrice: parseFloat(document.getElementById('minPrice').value) || null,
            maxPrice: parseFloat(document.getElementById('maxPrice').value) || null,
            year: document.getElementById('yearFilter').value,
            movement: document.getElementById('movementFilter').value,
            grade: document.getElementById('gradeFilter').value
        };
        
        filteredWatches = allWatches.filter(w => 
            (!filters.brand || w.brand === filters.brand) &&
            (filters.minPrice === null || w.price >= filters.minPrice) &&
            (filters.maxPrice === null || w.price <= filters.maxPrice) &&
            (!filters.year || w.year == filters.year) &&
            (!filters.movement || w.movement === filters.movement) &&
            (!filters.grade || w.analytics?.investmentGrade === filters.grade)
        );
        
        updateActiveFilters(filters);
        renderWatches(filteredWatches);
    }

    function resetFilters() {
        document.querySelectorAll('.filter-select, .filter-input').forEach(input => {
            input.value = '';
        });
        applyFilters();
    }

    function updateActiveFilters(filters) {
        const activeFiltersContainer = document.getElementById('activeFilters');
        activeFiltersContainer.innerHTML = '';
        
        const filterLabels = {
            brand: 'Brand', 
            minPrice: 'Min Price', 
            maxPrice: 'Max Price', 
            year: 'Year', 
            movement: 'Movement', 
            grade: 'Grade'
        };

        for (const [key, value] of Object.entries(filters)) {
            if (value) {
                const pill = document.createElement('div');
                pill.className = 'active-filter';
                pill.innerHTML = `
                    <span>${filterLabels[key]}: ${key.includes('Price') ? formatPrice(value) : value}</span>
                    <i class="fas fa-times"></i>
                `;
                pill.addEventListener('click', () => {
                    const element = document.getElementById(key.includes('Price') ? key : `${key}Filter`);
                    element.value = '';
                    applyFilters();
                });
                activeFiltersContainer.appendChild(pill);
            }
        }
    }

    // --- Cart Management Functions ---
    function saveCart() {
        localStorage.setItem('watchCart', JSON.stringify(cart));
    }

    function updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = itemCount;
            cartCount.style.display = itemCount > 0 ? 'block' : 'none';
        }
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // --- Utility Functions ---
    function populateSelect(id, options, defaultText) {
        const select = document.getElementById(id);
        if (!select) return;
        
        select.innerHTML = `
            <option value="">${defaultText}</option>
            ${options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
        `;
    }
    
    function escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return 'N/A';
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return unsafe.toString().replace(/[&<>"']/g, m => escapeMap[m]);
    }
    
    function formatPrice(price, currency = 'USD') {
        if (price === null || price === undefined) return 'Price on Request';
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency, 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        }).format(price);
    }
    
    function showLoading() {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading Collection...</p>
            </div>
        `;
    }
    
    function showError(message) {
        container.innerHTML = `
            <div class="error">
                <p>${message}</p>
            </div>
        `;
    }

    // Expose functions to window if needed
    window.applyFilters = applyFilters;
    window.resetFilters = resetFilters;
});