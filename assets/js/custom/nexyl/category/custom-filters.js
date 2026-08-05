export default function initCustomFilters() {
    const rootContainer = document.getElementById('nx-custom-filters-root');
    const listingContainer = document.getElementById('product-listing-container');
    const token = window.stencilStorefrontToken;
    const categoryId = window.currentCategoryId;

    if (!rootContainer || !listingContainer || !token || !categoryId) return;

    let allProducts = [];
    let isFetchingAll = false;
    let allProductsFetched = false;
    let activeFilters = {}; // e.g., { 'Heat Level': ['Spicy'], 'Size': ['16oz'] }

    // --- SKELETON LOADER ---
    function getSkeletonHTML() {
        return `
            <li class="product">
                <article class="nx-card">
                    <div class="nx-card__object skeleton nx-filter-skeleton-img"></div>
                    <div class="nx-card__body">
                        <div class="nx-card__meta">
                            <p class="nx-card__name skeleton nx-filter-skeleton-name"></p>
                            <div class="nx-pill skeleton nx-filter-skeleton-pill"></div>
                        </div>
                    </div>
                </article>
            </li>
        `;
    }

    function showSkeletons() {
        const grid = listingContainer.querySelector('.productGrid');
        if (grid) {
            grid.innerHTML = getSkeletonHTML().repeat(6);
        } else {
            listingContainer.innerHTML = `<ul class="productGrid">${getSkeletonHTML().repeat(6)}</ul>`;
        }
    }

    // --- PRE-FETCH ALL PRODUCTS ---
    function fetchAllProducts(cursor = null) {
        if (!cursor) {
            isFetchingAll = true;
            showSkeletons();
        }

        const cursorArg = cursor ? `, after: "${cursor}"` : '';
        const graphqlQuery = `
            query {
                site {
                    category(entityId: ${categoryId}) {
                        products(first: 50${cursorArg}) {
                            pageInfo {
                                hasNextPage
                                endCursor
                            }
                            edges {
                                node {
                                    entityId
                                    name
                                    path
                                    brand {
                                        name
                                    }
                                    prices {
                                        price {
                                            value
                                            formatted
                                        }
                                        salePrice {
                                            value
                                            formatted
                                        }
                                    }
                                    defaultImage {
                                        url(width: 500)
                                        altText
                                    }
                                    customFields {
                                        edges {
                                            node {
                                                name
                                                value
                                            }
                                        }
                                    }
                                    inventory {
                                        isInStock
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ query: graphqlQuery })
        })
            .then(res => res.json())
            .then(res => {
                const productsData = res?.data?.site?.category?.products;
                if (!productsData) return;

                const edges = productsData.edges || [];
                allProducts = allProducts.concat(edges);

                if (productsData.pageInfo && productsData.pageInfo.hasNextPage) {
                    fetchAllProducts(productsData.pageInfo.endCursor);
                } else {
                    allProductsFetched = true;
                    isFetchingAll = false;
                    buildSidebarFilters();
                    renderFilteredProducts();
                }
            })
            .catch(err => {
                console.error('Error fetching products:', err);
                isFetchingAll = false;
                listingContainer.innerHTML = '<p>Error loading products.</p>';
            });
    }

    // --- BUILD SIDEBAR FILTERS ---
    function buildSidebarFilters() {
        const uniqueCustomFields = {};

        // Group custom fields starting with filter_
        allProducts.forEach(edge => {
            const customFields = edge.node.customFields?.edges || [];
            customFields.forEach(cfEdge => {
                const name = cfEdge.node.name;
                const value = cfEdge.node.value;
                if (name.toLowerCase().startsWith('filter_')) {
                    const cleanName = name.substring(7); // remove 'filter_'
                    if (!uniqueCustomFields[cleanName]) {
                        uniqueCustomFields[cleanName] = new Set();
                    }
                    uniqueCustomFields[cleanName].add(value);
                }
            });
        });

        const filterToggleBtn = document.querySelector('.nx-filters-toggle');
        if (Object.keys(uniqueCustomFields).length === 0) {
            if (filterToggleBtn) filterToggleBtn.style.display = 'none';
            return;
        } else {
            if (filterToggleBtn) filterToggleBtn.style.display = ''; // Clear inline display:none
        }

        let html = '';

        // Clear all button
        html += `
            <div class="nx-custom-filter-clear">
                <button type="button" id="nx-clear-all-filters" class="nx-clear-filters-btn" style="display: none;">Clear All</button>
            </div>
        `;

        Object.keys(uniqueCustomFields).forEach(filterName => {
            const values = Array.from(uniqueCustomFields[filterName]).sort();
            if (values.length === 0) return;

            const safeId = filterName.replace(/\s+/g, '-');
            const displayName = filterName.replace(/_/g, ' ');

            html += `
                <div class="accordion-block nx-custom-filter-block">
                    <h2 class="accordion-heading nx-filter-heading">
                        <button type="button" class="accordion-navigation toggleLink is-open">
                            <span class="accordion-title nx-filter-title">${displayName}</span>
                        </button>
                    </h2>
                    <div id="facetedSearch-content--${safeId}" class="accordion-content is-open nx-filter-content">
                        <ul class="navList nx-filter-list">
            `;

            values.forEach(value => {
                html += `
                    <li class="navList-item nx-filter-item">
                        <a href="javascript:void(0);" 
                           class="navList-action navList-action--checkbox nx-filter-action" 
                           data-filter-name="${filterName}" 
                           data-filter-value="${value}">
                            ${value}
                        </a>
                    </li>
                `;
            });

            html += `
                        </ul>
                    </div>
                </div>
            `;
        });

        rootContainer.innerHTML = html;

        // Attach listeners
        const actions = rootContainer.querySelectorAll('.nx-filter-action');
        actions.forEach(btn => {
            btn.addEventListener('click', handleFilterChange);
        });

        const clearBtn = document.getElementById('nx-clear-all-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                activeFilters = {};
                actions.forEach(a => a.classList.remove('is-selected'));
                clearBtn.style.display = 'none';
                const filterToggle = document.querySelector('.nx-filters-toggle');
                if (filterToggle) filterToggle.classList.remove('has-active-filters');
                renderFilteredProducts();
            });
        }
    }

    function handleFilterChange(e) {
        e.preventDefault();
        const target = e.currentTarget;
        const name = target.getAttribute('data-filter-name');
        const value = target.getAttribute('data-filter-value');
        
        target.classList.toggle('is-selected');
        const isChecked = target.classList.contains('is-selected');

        if (!activeFilters[name]) {
            activeFilters[name] = [];
        }

        if (isChecked) {
            activeFilters[name].push(value);
        } else {
            activeFilters[name] = activeFilters[name].filter(v => v !== value);
            if (activeFilters[name].length === 0) {
                delete activeFilters[name];
            }
        }

        const clearBtn = document.getElementById('nx-clear-all-filters');
        if (clearBtn) {
            clearBtn.style.display = Object.keys(activeFilters).length > 0 ? 'block' : 'none';
        }

        const filterToggle = document.querySelector('.nx-filters-toggle');
        if (filterToggle) {
            if (Object.keys(activeFilters).length > 0) {
                filterToggle.classList.add('has-active-filters');
            } else {
                filterToggle.classList.remove('has-active-filters');
            }
        }

        searchPageCurrent = 1;
        renderFilteredProducts();
    }

    let searchPageLimit = 12;
    let searchPageCurrent = 1;

    // --- RENDER PRODUCTS ---
    function renderFilteredProducts(append = false) {
        let filteredProducts = allProducts;

        // Apply filters (AND logic between groups, OR logic within groups)
        const filterKeys = Object.keys(activeFilters);
        if (filterKeys.length > 0) {
            filteredProducts = allProducts.filter(edge => {
                const productCustomFields = edge.node.customFields?.edges
                    .filter(cf => cf.node.name.toLowerCase().startsWith('filter_'))
                    .map(cf => ({
                        name: cf.node.name.substring(7),
                        value: cf.node.value
                    })) || [];

                return filterKeys.every(filterName => {
                    const selectedValues = activeFilters[filterName];
                    const productValuesForField = productCustomFields.filter(cf => cf.name === filterName).map(cf => cf.value);
                    return selectedValues.some(val => productValuesForField.includes(val));
                });
            });
        }

        const grid = listingContainer.querySelector('.productGrid');
        if (!grid) return;

        if (filteredProducts.length === 0) {
            grid.innerHTML = '<p class="nx-custom-filter-empty">No products found matching your filters.</p>';
            removeLoadMoreBtn();
            return;
        }

        const paginatedProducts = filteredProducts.slice(0, searchPageCurrent * searchPageLimit);

        let html = '';
        paginatedProducts.forEach(edge => {
            const product = edge.node;
            const price = product.prices?.price?.formatted || '';
            const imageUrl = product.defaultImage?.url || '';

            let sizeOrWeight = '';
            let origin = '';
            let nickname = '';

            const customFields = product.customFields?.edges || [];
            customFields.forEach(cfEdge => {
                const name = cfEdge.node.name;
                const value = cfEdge.node.value;
                if (name === 'weight' || name === 'size') sizeOrWeight = value;
                if (name === 'filter_sauce_region') origin = value;
                if (name === 'nick_name') nickname = value;
            });

            const displayName = nickname ? nickname : product.name;
            const brandName = product.brand?.name || '';
            const originHtml = origin ? `<p class="nx-card__origin">${origin}</p>` : '';
            
            // Badge logic
            let badgeHtml = '';
            if (product.inventory?.isInStock === false) {
                badgeHtml = `<div class="nx-badge nx-badge--sold-out">Out of stock</div>`;
            } else if (product.prices?.salePrice) {
                badgeHtml = `<div class="nx-badge nx-badge--sale">Sale</div>`;
            }

            html += `
                <li class="product">
                    <article class="nx-card" 
                        data-test="card-${product.entityId}" 
                        data-entity-id="${product.entityId}"
                        data-name="${product.name}"
                        data-product-brand="${brandName}"
                        data-product-price="${product.prices?.price?.value || ''}">
                        <a href="${product.path}" class="nx-card__link" aria-label="${product.name}" data-event-type="product-click">
                            <div class="nx-card__object">
                                ${badgeHtml}
                                ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" loading="lazy">` : ''}
                            </div>
                        </a>
                        <div class="nx-card__body">
                            <div class="nx-card__meta">
                                ${originHtml}
                                <p class="nx-card__name">
                                    <a href="${product.path}" aria-label="${product.name}" data-event-type="product-click" style="color: inherit; text-decoration: none;">
                                        ${displayName}
                                    </a>
                                </p>
                                <div class="nx-pill">
                                    <span class="nx-pill__inner">
                                        <span class="nx-pill__price">
                                            <span>${price}</span>
                                        </span>
                                        ${sizeOrWeight ? `<span class="nx-pill__size">${sizeOrWeight}</span>` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </article>
                </li>
            `;
        });

        grid.innerHTML = html;
        
        // Handle Load More button
        if (filteredProducts.length > searchPageCurrent * searchPageLimit) {
            renderLoadMoreBtn();
        } else {
            removeLoadMoreBtn();
        }
        
        // Update count
        const countEl = document.querySelector('.nx-toolbar__count');
        if (countEl) {
            countEl.textContent = `${filteredProducts.length} Items`;
        }
    }

    function renderLoadMoreBtn() {
        let btnContainer = document.getElementById('nx-category-load-more-wrap');
        if (!btnContainer) {
            btnContainer = document.createElement('div');
            btnContainer.id = 'nx-category-load-more-wrap';
            btnContainer.className = 'nx-load-more-wrap';
            
            const btn = document.createElement('button');
            btn.id = 'nx-category-load-more-btn';
            btn.className = 'button button--primary';
            btn.textContent = 'Load More';
            btn.addEventListener('click', handleLoadMore);
            
            btnContainer.appendChild(btn);
            listingContainer.appendChild(btnContainer);
        } else {
            btnContainer.style.display = 'block';
            const btn = document.getElementById('nx-category-load-more-btn');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Load More';
            }
        }
    }

    function removeLoadMoreBtn() {
        const btnContainer = document.getElementById('nx-category-load-more-wrap');
        if (btnContainer) {
            btnContainer.style.display = 'none';
        }
    }

    function handleLoadMore() {
        const btn = document.getElementById('nx-category-load-more-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Loading...';
        }

        // Append 3 skeletons to the grid immediately to fake loading
        const grid = listingContainer.querySelector('.productGrid');
        if (grid) {
            const tempSkeletons = document.createElement('div');
            tempSkeletons.innerHTML = getSkeletonHTML().repeat(3);
            while (tempSkeletons.firstChild) {
                grid.appendChild(tempSkeletons.firstChild);
            }
        }
        
        // Fake delay for realistic UX
        setTimeout(() => {
            searchPageCurrent++;
            renderFilteredProducts();
        }, 600);
    }

    // Initialize
    fetchAllProducts();
}
