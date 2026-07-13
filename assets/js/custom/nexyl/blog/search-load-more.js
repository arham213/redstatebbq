import { initRelativeDates, initBlogBadges } from './date-badge';

export default function initSearchLoadMore() {
    const loadMoreBtn = document.getElementById('nx-blog-load-more');
    const searchInput = document.getElementById('nx-blog-search-input');
    const cardsWrap = document.querySelector('.card-row');
    
    if (!cardsWrap) return;

    // Cache the original HTML for when search is cleared
    let originalCardsHTML = cardsWrap.innerHTML;
    let originalLoadMoreNext = loadMoreBtn ? loadMoreBtn.getAttribute('data-next-page') : null;
    let isOriginalState = true;

    // Local Search State
    let allPosts = [];
    let isFetchingAll = false;
    let allPostsFetched = false;
    let filteredPosts = [];
    let searchPageLimit = 6;
    let searchPageCurrent = 1;

    // --- SKELETON LOADER ---
    function getSkeletonHTML() {
        return `
            <article class="bcard nx-blog-post skeleton-card">
                <div class="bcard-img skeleton"></div>
                <div class="bcard-body">
                    <div class="bcard-title skeleton" style="width: 80%"></div>
                    <div class="time skeleton"></div>
                    <div class="bcard-foot">
                        <div class="badge skeleton"></div>
                        <div class="btn-outline skeleton"></div>
                    </div>
                </div>
            </article>
        `;
    }

    // --- PRE-FETCH ALL POSTS ---
    function fetchAllPosts(cursor = null) {
        const token = window.stencilStorefrontToken;
        if (!token) return;

        isFetchingAll = true;
        
        const cursorArg = cursor ? `, after: "${cursor}"` : '';
        const graphqlQuery = `
            query {
                site {
                    content {
                        blog {
                            posts(first: 50${cursorArg}) {
                                pageInfo {
                                    hasNextPage
                                    endCursor
                                }
                                edges {
                                    node {
                                        name
                                        path
                                        publishedDate { utc }
                                        thumbnailImage { url(width: 500) }
                                        tags
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
            const postsData = res?.data?.site?.content?.blog?.posts;
            if (!postsData) return;

            const edges = postsData.edges || [];
            allPosts = allPosts.concat(edges);

            if (postsData.pageInfo && postsData.pageInfo.hasNextPage) {
                // Fetch next page recursively
                fetchAllPosts(postsData.pageInfo.endCursor);
            } else {
                allPostsFetched = true;
                isFetchingAll = false;
            }
        })
        .catch(err => {
            console.error('Error fetching blog posts:', err);
            isFetchingAll = false;
        });
    }

    // Trigger pre-fetch on page load
    fetchAllPosts();

    // --- LOAD MORE FUNCTIONALITY ---
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            // Local Search Pagination
            if (!isOriginalState) {
                this.textContent = 'Loading...';
                this.disabled = true;

                const remaining = filteredPosts.length - (searchPageCurrent * searchPageLimit);
                const skeletonCount = Math.min(searchPageLimit, remaining > 0 ? remaining : searchPageLimit);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = getSkeletonHTML().repeat(skeletonCount);
                const skeletons = Array.from(tempDiv.children);
                skeletons.forEach(skel => cardsWrap.appendChild(skel));

                setTimeout(() => {
                    skeletons.forEach(skel => skel.remove());
                    
                    searchPageCurrent++;
                    const start = (searchPageCurrent - 1) * searchPageLimit;
                    const end = start + searchPageLimit;
                    const chunk = filteredPosts.slice(start, end);
                    
                    cardsWrap.insertAdjacentHTML('beforeend', generateCardsHTML(chunk));
                    initRelativeDates();
                    initBlogBadges();

                    if (end >= filteredPosts.length) {
                        loadMoreBtn.style.display = 'none';
                    } else {
                        this.textContent = 'Load More';
                        this.disabled = false;
                    }
                }, 1200); // 1200ms simulated delay

                return;
            }

            // Original Server-Side Pagination
            const nextPageUrl = this.getAttribute('data-next-page');
            if (!nextPageUrl) return;

            this.textContent = 'Loading...';
            this.disabled = true;

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = getSkeletonHTML().repeat(6);
            const skeletons = Array.from(tempDiv.children);
            skeletons.forEach(skel => cardsWrap.appendChild(skel));

            fetch(nextPageUrl)
                .then(res => res.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    skeletons.forEach(skel => skel.remove());

                    const newCards = doc.querySelectorAll('.card-row > article');
                    newCards.forEach(card => cardsWrap.appendChild(card));

                    originalCardsHTML = cardsWrap.innerHTML;

                    const newLoadMore = doc.getElementById('nx-blog-load-more');
                    if (newLoadMore && newLoadMore.getAttribute('data-next-page')) {
                        const newUrl = newLoadMore.getAttribute('data-next-page');
                        this.setAttribute('data-next-page', newUrl);
                        originalLoadMoreNext = newUrl;
                        this.textContent = 'Load More';
                        this.disabled = false;
                    } else {
                        this.style.display = 'none';
                        originalLoadMoreNext = null;
                    }

                    initRelativeDates();
                    initBlogBadges();
                })
                .catch(err => {
                    console.error('Error loading more blogs:', err);
                    this.textContent = 'Load More';
                    this.disabled = false;
                    skeletons.forEach(skel => skel.remove());
                });
        });
    }

    // --- SEARCH FUNCTIONALITY ---
    if (searchInput) {
        let debounceTimer;

        searchInput.addEventListener('input', function(e) {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim().toLowerCase();

            debounceTimer = setTimeout(() => {
                if (query.length === 0) {
                    // Restore original state
                    isOriginalState = true;
                    cardsWrap.innerHTML = originalCardsHTML;
                    if (loadMoreBtn) {
                        if (originalLoadMoreNext) {
                            loadMoreBtn.setAttribute('data-next-page', originalLoadMoreNext);
                            loadMoreBtn.style.display = 'inline-flex';
                            loadMoreBtn.textContent = 'Load More';
                            loadMoreBtn.disabled = false;
                        } else {
                            loadMoreBtn.style.display = 'none';
                        }
                    }
                    initRelativeDates();
                    initBlogBadges();
                    return;
                }

                // Perform Search
                isOriginalState = false;
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                
                cardsWrap.innerHTML = getSkeletonHTML().repeat(6);

                performLocalSearch(query);
            }, 400);
        });
    }

    function performLocalSearch(query) {
        // If still fetching, we wait briefly (simple retry mechanism)
        if (!allPostsFetched && isFetchingAll) {
            setTimeout(() => performLocalSearch(query), 500);
            return;
        }

        filteredPosts = allPosts.filter(edge => {
            const node = edge.node;
            const titleMatch = node.name.toLowerCase().includes(query);
            const tagsMatch = node.tags && node.tags.some(t => t.toLowerCase().includes(query));
            return titleMatch || tagsMatch;
        });

        searchPageCurrent = 1;
        const initialChunk = filteredPosts.slice(0, searchPageLimit);
        
        if (filteredPosts.length === 0) {
            cardsWrap.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; font-size: 18px; color: #6a0111;">No blogs found matching your search.</p>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        cardsWrap.innerHTML = generateCardsHTML(initialChunk);
        initRelativeDates();
        initBlogBadges();

        if (filteredPosts.length > searchPageLimit && loadMoreBtn) {
            loadMoreBtn.style.display = 'inline-flex';
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.disabled = false;
        }
    }

    function generateCardsHTML(posts) {
        return posts.map(edge => {
            const node = edge.node;
            const themeFallback = window.stencilDefaultImage;
            const fallbackImg = '/stencil/00000000-0000-0000-0000-000000000001/img/ProductDefault.gif'; 
            const imgUrl = node.thumbnailImage ? node.thumbnailImage.url : fallbackImg;
            const dateStr = new Date(node.publishedDate.utc).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            const tagsStr = (node.tags || []).join(',');

            return `
                <article class="bcard nx-blog-post">
                    <div class="bcard-img">
                        <a href="${node.path}">
                            <img src="${imgUrl}" alt="${node.name}" class="lazyload">
                        </a>
                    </div>
                    <div class="bcard-body">
                        <h3 class="bcard-title display"><a href="${node.path}">${node.name}</a></h3>
                        <div class="time">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="#4B4B4A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M15.7109 15.1798L12.6109 13.3298C12.0709 13.0098 11.6309 12.2398 11.6309 11.6098V7.50977" stroke="#4B4B4A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <p class="nx-blog-date" data-blog-date="${node.publishedDate.utc}">${dateStr}</p>
                        </div>
                        <div class="bcard-foot">
                            <div class="badge nx-blog-badge" data-tags="${tagsStr}">Blog</div>
                            <a href="${node.path}" class="btn-outline">Read</a>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }
}
