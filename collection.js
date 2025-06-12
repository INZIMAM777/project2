document.addEventListener('DOMContentLoaded', () => {
    // Collection-specific variables
    let allWatches = [];
    let filteredWatches = [];
    const batchSize = 10;
    let currentBatch = 0;

    // Initialize filter toggle
    function initFilterToggle() {
        const toggleBtn = document.getElementById('toggleFiltersBtn');
        const filtersSection = document.getElementById('filtersSection');
        
        if (toggleBtn && filtersSection) {
            toggleBtn.addEventListener('click', () => {
                filtersSection.style.display = filtersSection.style.display === 'none' ? 'block' : 'none';
            });
        }
    }

    // Load watch collection
    async function loadWatchCollection() {
        try {
            const response = await fetch('watches.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format: expected an array');
            }
            allWatches = data;
            filteredWatches = [...allWatches];
            processWatchesInBatches(filteredWatches);
            populateFilterOptions();
        } catch (error) {
            console.error('Error loading watch collection:', error);
            // Show error message to user
            const grid = document.getElementById('watchGrid');
            if (grid) {
                grid.innerHTML = `
                    <div class="error-message">
                        <h3>Error Loading Collection</h3>
                        <p>Please try refreshing the page or contact support if the problem persists.</p>
                    </div>
                `;
            }
        }
    }

    // Process watches in batches for better performance
    function processWatchesInBatches(watches) {
        if (!Array.isArray(watches) || watches.length === 0) return;
        
        const start = currentBatch * batchSize;
        const end = start + batchSize;
        const batch = watches.slice(start, end);
        
        if (batch.length > 0) {
            displayWatches(batch);
            currentBatch++;
            
            if (end < watches.length) {
                requestAnimationFrame(() => processWatchesInBatches(watches));
            }
        }
    }

    // Display watches in the grid
    function displayWatches(watches) {
        const grid = document.getElementById('watchGrid');
        if (!grid) return;
        
        watches.forEach(watch => {
            const card = createWatchCard(watch);
            grid.appendChild(card);
        });
    }

    // Create watch card element
    function createWatchCard(watch) {
        const card = document.createElement('div');
        card.className = 'watch-card';
        card.innerHTML = `
            <div class="watch-image">
                <img src="${watch.image}" alt="${watch.model}" loading="lazy">
            </div>
            <div class="watch-info">
                <h3>${watch.brand} ${watch.model}</h3>
                <p class="price">$${watch.price.toLocaleString()}</p>
                <p class="year">${watch.year}</p>
                <div class="watch-details">
                    <span>${watch.movement}</span>
                    <span>${watch.caseSize}mm</span>
                </div>
            </div>
        `;
        return card;
    }

    // Populate filter options
    function populateFilterOptions() {
        if (!Array.isArray(allWatches) || allWatches.length === 0) return;

        const brands = [...new Set(allWatches.map(watch => watch.brand))];
        const years = [...new Set(allWatches.map(watch => watch.year))];
        const movements = [...new Set(allWatches.map(watch => watch.movement))];
        const grades = [...new Set(allWatches.map(watch => watch.analytics?.investmentGrade))];

        populateSelect('brandFilter', brands);
        populateSelect('yearFilter', years);
        populateSelect('movementFilter', movements);
        populateSelect('gradeFilter', grades);
    }

    // Populate select element with options
    function populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;

        options.forEach(option => {
            if (option) {  // Only add non-null/undefined options
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            }
        });
    }

    // Apply filters
    function applyFilters() {
        if (!Array.isArray(allWatches)) return;

        const filters = {
            brand: document.getElementById('brandFilter')?.value || '',
            minPrice: document.getElementById('minPrice')?.value || '',
            maxPrice: document.getElementById('maxPrice')?.value || '',
            year: document.getElementById('yearFilter')?.value || '',
            movement: document.getElementById('movementFilter')?.value || '',
            grade: document.getElementById('gradeFilter')?.value || ''
        };

        filteredWatches = allWatches.filter(watch => {
            return (
                (!filters.brand || watch.brand === filters.brand) &&
                (!filters.minPrice || watch.price >= Number(filters.minPrice)) &&
                (!filters.maxPrice || watch.price <= Number(filters.maxPrice)) &&
                (!filters.year || watch.year === Number(filters.year)) &&
                (!filters.movement || watch.movement === filters.movement) &&
                (!filters.grade || watch.analytics?.investmentGrade === filters.grade)
            );
        });

        updateActiveFilters(filters);
        resetGrid();
        processWatchesInBatches(filteredWatches);
    }

    // Update active filters display
    function updateActiveFilters(filters) {
        const activeFilters = document.getElementById('activeFilters');
        if (!activeFilters) return;

        activeFilters.innerHTML = '';

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                let label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                let displayValue = value;

                if (key === 'minPrice' || key === 'maxPrice') {
                    displayValue = `$${Number(value).toLocaleString()}`;
                }

                addActiveFilter(label, displayValue, () => {
                    const filterElement = document.getElementById(key + 'Filter');
                    if (filterElement) {
                        filterElement.value = '';
                    }
                    if (key.startsWith('min') || key.startsWith('max')) {
                        const inputElement = document.getElementById(key);
                        if (inputElement) {
                            inputElement.value = '';
                        }
                    }
                    applyFilters();
                });
            }
        });
    }

    // Add active filter tag
    function addActiveFilter(label, value, removeCallback) {
        const activeFilters = document.getElementById('activeFilters');
        if (!activeFilters) return;

        const filter = document.createElement('div');
        filter.className = 'active-filter';
        filter.innerHTML = `
            ${label}: ${value}
            <i class="fas fa-times"></i>
        `;
        filter.addEventListener('click', removeCallback);
        activeFilters.appendChild(filter);
    }

    // Reset filters
    function resetFilters() {
        const filterInputs = document.querySelectorAll('.filter-select, .filter-input');
        filterInputs.forEach(input => {
            input.value = '';
        });
        filteredWatches = [...allWatches];
        updateActiveFilters({});
        resetGrid();
        processWatchesInBatches(filteredWatches);
    }

    // Reset watch grid
    function resetGrid() {
        const grid = document.getElementById('watchGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        currentBatch = 0;
    }

    // Initialize everything
    function init() {
        initFilterToggle();
        loadWatchCollection();
    }

    // Start the application
    init();

    // Expose functions to window
    window.loadWatchCollection = loadWatchCollection;
    window.resetFilters = resetFilters;
    window.applyFilters = applyFilters;
}); 