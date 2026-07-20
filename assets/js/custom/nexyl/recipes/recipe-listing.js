import Swiper from 'swiper';

export default function initRecipeListing() {
    const heroContainer = document.getElementById('nx-recipe-hero-container');
    const tabsContainer = document.getElementById('nx-recipe-tabs-container');
    const gridContainer = document.getElementById('nx-recipe-grid-container');
    const loadMoreWrapper = document.getElementById('nx-recipe-load-more-wrapper');
    const loadMoreBtn = document.getElementById('nx-recipe-load-more');

    // Only run if we are on the recipe listing page
    if (!heroContainer || !tabsContainer || !gridContainer) return;

    let allRecipes = [];
    let currentCategory = 'All';
    let currentDisplayCount = 0;
    const RECIPES_PER_PAGE = 6;

    async function fetchAllPages() {
        let pages = [];
        let hasNextPage = true;
        let cursor = '';

        while (hasNextPage) {
            const query = `
                query getPages($cursor: String) {
                    site {
                        content {
                            pages(first: 50, after: $cursor) {
                                pageInfo {
                                    hasNextPage
                                    endCursor
                                }
                                edges {
                                    node {
                                        entityId
                                        name
                                        parentEntityId
                                        children {
                                            edges {
                                                node {
                                                    entityId
                                                    parentEntityId
                                                    name
                                                }
                                            }
                                        }
                                        ... on NormalPage {
                                            path
                                            htmlBody
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            try {
                const response = await fetch('/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.stencilStorefrontToken}`
                    },
                    body: JSON.stringify({ query, variables: { cursor: cursor || null } })
                });

                const json = await response.json();
                const data = json.data.site.content.pages;

                data.edges.forEach(edge => pages.push(edge.node));

                hasNextPage = data.pageInfo.hasNextPage;
                cursor = data.pageInfo.endCursor;
            } catch (error) {
                console.error("Error fetching GraphQL pages:", error);
                break;
            }
        }

        return pages;
    }

    function parseRecipeData(pageNode, categoryMap) {
        const html = pageNode.htmlBody || '';
        let strippedHtml = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]*>?/gm, '')
            .trim();

        // Extract Image [RECIPE IMAGE] ... [META DATA]
        let imageMatch = html.match(/\[RECIPE IMAGE\][\s\S]*?<img[^>]+src="([^">]+)"/i);
        let image = imageMatch ? imageMatch[1] : '';

        // Extract Cook Time: 15 mins
        let timeMatch = strippedHtml.match(/Cook Time:\s*(.+?)(?:\n|$)/i);
        let cookTime = timeMatch ? timeMatch[1].trim() : '1 hr';

        // Extract Rating: 4.8
        let ratingMatch = strippedHtml.match(/Rating:\s*([\d.]+)/i);
        let rating = ratingMatch ? ratingMatch[1].trim() : '4.8';

        // Extract Min Read: 5
        let minReadMatch = strippedHtml.match(/Min Read:\s*(.+?)(?:\n|$)/i);
        let minRead = minReadMatch ? minReadMatch[1].trim() : '';

        // Extract Badges: BBQ, Brisket
        let badgesMatch = strippedHtml.match(/Tags:\s*(.+?)(?:\n|$)/i);
        let badges = [];
        if (badgesMatch) {
            badges = badgesMatch[1].split(',').map(b => b.trim());
        }

        // Determine Category from children mapping
        let categoryName = categoryMap[pageNode.name] || 'All';
        if (categoryName === 'Recipes') {
            categoryName = 'All';
        }

        return {
            title: pageNode.name,
            url: pageNode.path,
            image: image,
            cookTime: cookTime,
            rating: rating,
            badges: badges,
            minRead: minRead,
            category: categoryName,
            isHero: categoryName === 'Recipes For You',
            parentEntityId: pageNode.parentEntityId
        };
    }

    function renderHero(recipes) {
        const container = document.getElementById('nx-recipe-hero-container');
        if (!container) return;

        if (recipes.length === 0) {
            const heroSection = document.querySelector('.recipe-hero-listing');
            if (heroSection) heroSection.style.display = 'none';
            return;
        }

        let html = '';
        recipes.forEach(r => {
            html += `
                <div class="swiper-slide hero-card">
                    <a href="${r.url}">
                        <img src="${r.image}" alt="${r.title}">
                        <div class="hero-overlay">
                            <h2 class="display hero-title">${r.title}</h2>
                        </div>
                    </a>
                </div>
            `;
        });
        container.innerHTML = html;

        // Initialize Swiper
        new Swiper('.nx-recipe-hero-swiper', {
            slidesPerView: 'auto',
            spaceBetween: 16,
            centeredSlides: true,
            loop: recipes.length > 1,
            breakpoints: {
                768: {
                    slidesPerView: 'auto',
                    spaceBetween: 24,
                    centeredSlides: true,
                },
                1024: {
                    slidesPerView: 'auto',
                    spaceBetween: 32,
                    centeredSlides: true,
                }
            }
        });
    }

    function renderTabs(categories) {
        const catHead = document.querySelector('.cat-head');
        const titleEl = catHead ? catHead.querySelector('.section-title') : null;

        if (categories.length === 0) {
            if (titleEl) titleEl.textContent = 'Our Recipes';
            if (tabsContainer) tabsContainer.style.display = 'none';
            return;
        }

        if (titleEl) titleEl.textContent = 'Our Categories';
        if (tabsContainer) tabsContainer.style.display = 'flex'; // or block based on css

        let html = `<div class="tab ${currentCategory === 'All' ? 'active' : ''}" data-cat="All">All</div>`;
        categories.forEach(c => {
            if (c !== 'Recipes For You') {
                html += `<div class="tab ${currentCategory === c ? 'active' : ''}" data-cat="${c}">${c}</div>`;
            }
        });
        tabsContainer.innerHTML = html;

        // Bind events
        tabsContainer.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.getAttribute('data-cat');
                currentDisplayCount = 0;
                gridContainer.innerHTML = ''; // Clear grid
                renderGrid();
            });
        });
    }

    function renderGrid() {
        let filteredRecipes = allRecipes.filter(r => !r.isHero);
        if (currentCategory !== 'All') {
            filteredRecipes = filteredRecipes.filter(r => r.category === currentCategory);
        }

        const toDisplay = filteredRecipes.slice(currentDisplayCount, currentDisplayCount + RECIPES_PER_PAGE);

        let html = '';
        toDisplay.forEach(r => {
            // Priority: 'min read' tag, else first tag, else 'Recipe'
            let mainBadge = r.minRead ? `${r.minRead} min read` : (r.badges.length > 0 ? r.badges[0] : 'Recipe');

            html += `
                <article class="rcard">
                    <div class="rcard-img">
                        <a href="${r.url}">
                            <img src="${r.image}" alt="${r.title}" />
                        </a>
                    </div>
                    <div class="rcard-body">
                        <h3 class="rcard-title display"><a href="${r.url}">${r.title}</a></h3>
                        <div class="rating">
                            <div class="nx-pdp-stars-container" style="position: relative; display: inline-flex; vertical-align: middle;">
                                <div class="nx-pdp-stars-empty" style="display: flex; gap: 2px;">
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="filter: grayscale(1); opacity: 0.2;" />
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="filter: grayscale(1); opacity: 0.2;" />
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="filter: grayscale(1); opacity: 0.2;" />
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="filter: grayscale(1); opacity: 0.2;" />
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="filter: grayscale(1); opacity: 0.2;" />
                                </div>
                                <div class="nx-pdp-stars-filled" style="position: absolute; top: 0; left: 0; display: flex; gap: 2px; overflow: hidden; width: ${(parseFloat(r.rating) / 5) * 100}%; white-space: nowrap;">
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="min-width: 14px;" />
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="min-width: 14px;" />
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="min-width: 14px;" />
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="min-width: 14px;" />
                                    <img src="/assets/img/custom/nexyl/yellow-star.svg" alt="" class="nx-pdp-star-icon" style="min-width: 14px;" />
                                </div>
                            </div>
                            <div class="rating-num">
                                <p>${r.rating}</p>
                            </div>
                        </div>
                        <div class="time">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#4B4B4A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M15.7099 15.1798L12.6099 13.3298C12.0699 13.0098 11.6299 12.2398 11.6299 11.6098V7.50977" stroke="#4B4B4A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <p>${r.cookTime}</p>
                        </div>
                        <div class="badge">${mainBadge}</div>
                    </div>
                </article>
            `;
        });

        // If appending (Load More), add to HTML, else replace
        if (currentDisplayCount === 0) {
            gridContainer.innerHTML = html;
        } else {
            gridContainer.insertAdjacentHTML('beforeend', html);
        }

        currentDisplayCount += toDisplay.length;

        // Handle Load More Button visibility
        if (currentDisplayCount < filteredRecipes.length) {
            loadMoreWrapper.style.display = 'block';
        } else {
            loadMoreWrapper.style.display = 'none';
        }
    }

    async function init() {
        const pages = await fetchAllPages();

        // Build category map: Recipe Name -> Category Name
        const categoryMap = {};
        pages.forEach(p => {
            if (p.children && p.children.edges.length > 0) {
                p.children.edges.forEach(child => {
                    categoryMap[child.node.name] = p.name;
                });
            }
        });

        // Filter for valid recipes by checking if they contain the exact [RECIPE IMAGE] delimiter
        const rawRecipes = pages.filter(p => p.htmlBody && p.htmlBody.includes('[RECIPE IMAGE]'));

        allRecipes = rawRecipes.map(p => parseRecipeData(p, categoryMap));

        // Save to SessionStorage for the Detail page
        sessionStorage.setItem('nx_recipes_cache', JSON.stringify(allRecipes));

        // Separate Hero Recipes
        const heroRecipes = allRecipes.filter(r => r.isHero);

        // Extract unique categories (excluding hero and 'All')
        const categories = Array.from(new Set(allRecipes.filter(r => !r.isHero && r.category !== 'All').map(r => r.category)));

        renderHero(heroRecipes);
        renderTabs(categories);
        renderGrid();

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                renderGrid();
            });
        }
    }

    init();
}
