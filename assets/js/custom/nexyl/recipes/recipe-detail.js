import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

export default function initRecipeDetail() {
    const rawDataEl = document.getElementById('raw-recipe-data');
    if (!rawDataEl) return;

    const rawHtml = rawDataEl.innerHTML;

    function extractSection(startTag, endTags) {
        let startIndex = rawHtml.indexOf(startTag);
        if (startIndex === -1) return '';
        startIndex += startTag.length;
        
        let endIndex = rawHtml.length;
        for (let tag of endTags) {
            let index = rawHtml.indexOf(tag, startIndex);
            if (index !== -1 && index < endIndex) {
                endIndex = index;
            }
        }
        return rawHtml.substring(startIndex, endIndex).trim();
    }

    const shortDesc = extractSection('[SHORT DESCRIPTION]', ['[RECIPE IMAGE]', '[META DATA]', '[INGREDIENTS]', '[METHOD]']);
    const recipeImage = extractSection('[RECIPE IMAGE]', ['[META DATA]', '[INGREDIENTS]', '[METHOD]', '[SHORT DESCRIPTION]']);
    const metaData = extractSection('[META DATA]', ['[INGREDIENTS]', '[METHOD]', '[SHORT DESCRIPTION]', '[RECIPE IMAGE]']);
    const ingredients = extractSection('[INGREDIENTS]', ['[METHOD]', '[SHORT DESCRIPTION]', '[RECIPE IMAGE]', '[META DATA]']);
    const method = extractSection('[METHOD]', ['[SHORT DESCRIPTION]', '[RECIPE IMAGE]', '[META DATA]', '[INGREDIENTS]']);

    // 1. Populate Short Description
    const descEl = document.getElementById('nx-recipe-desc');
    if (descEl) descEl.innerHTML = shortDesc;

    // 2. Populate Image
    const imgEl = document.getElementById('nx-recipe-hero-image');
    if (imgEl && recipeImage) {
        let imgMatch = recipeImage.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch) {
            imgEl.innerHTML = `<img src="${imgMatch[1]}" alt="Recipe Image">`;
        }
    }

    // 3. Populate Meta Data
    // Expects: Cook Time: 15 mins, Prep Time: 30 mins, Servings: 4, Tags: BBQ, Brisket
    if (metaData) {
        let cookTime = metaData.match(/Cook Time:\s*(.+?)(?:<br|<\/p>|\n|$)/i);
        let prepTime = metaData.match(/Prep Time:\s*(.+?)(?:<br|<\/p>|\n|$)/i);
        let servings = metaData.match(/Servings:\s*(.+?)(?:<br|<\/p>|\n|$)/i);
        let tags = metaData.match(/Tags:\s*(.+?)(?:<br|<\/p>|\n|$)/i);

        if (cookTime) document.getElementById('nx-recipe-cook-time').textContent = `Cook ${cookTime[1].trim()}`;
        if (prepTime) document.getElementById('nx-recipe-prep-time').textContent = `Prep ${prepTime[1].trim()}`;
        if (servings) document.getElementById('nx-recipe-servings').textContent = `Serves ${servings[1].trim()}`;
        
        if (tags) {
            let tagsArray = tags[1].split(',').map(t => t.trim());
            let badgesHtml = tagsArray.map(t => `<span class="badge">${t}</span>`).join('');
            document.getElementById('nx-recipe-badges').innerHTML = badgesHtml;
        }
    }

    // 4. Populate Ingredients
    const ingEl = document.getElementById('nx-recipe-ingredients');
    if (ingEl && ingredients) {
        // Strip out HTML tags first, then split by line breaks or just parse <p> tags
        // To be safe, let's create a temporary div to extract text lines
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ingredients;
        
        let lines = tempDiv.innerHTML.split(/<br\s*\/?>|<\/p><p>|\n/i).map(l => l.replace(/<[^>]*>?/gm, '').trim()).filter(l => l);
        
        let html = '';
        lines.forEach(line => {
            // Assume format "30g Unsalted butter" -> split first space
            let firstSpace = line.indexOf(' ');
            if (firstSpace !== -1) {
                let qty = line.substring(0, firstSpace);
                let item = line.substring(firstSpace + 1);
                html += `<div class="ingredient-row"><span>${qty}</span><span>${item}</span></div>`;
            } else {
                html += `<div class="ingredient-row"><span style="width: 100%;">${line}</span></div>`;
            }
        });
        ingEl.innerHTML = html;
    }

    // 5. Populate Method & Format Bullets
    const methodEl = document.getElementById('nx-recipe-method');
    if (methodEl && method) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = method;
        
        // Find ordered/unordered lists and format them
        const lists = tempDiv.querySelectorAll('ol, ul');
        
        if (lists.length > 0) {
            lists.forEach(list => {
                let formattedHtml = '';
                list.querySelectorAll('li').forEach((li, index) => {
                    let num = list.tagName.toLowerCase() === 'ol' ? index + 1 : '•';
                    formattedHtml += `<div class="method-step"><span class="num">${num}</span><p class="txt">${li.innerHTML}</p></div>`;
                });
                
                // Replace the list with the formatted HTML
                const wrapper = document.createElement('div');
                wrapper.innerHTML = formattedHtml;
                list.parentNode.replaceChild(wrapper, list);
            });
            methodEl.innerHTML = tempDiv.innerHTML;
        } else {
            // Fallback: If they just pasted text with numbers like "1. Preheat..."
            let lines = tempDiv.innerHTML.split(/<br\s*\/?>|<\/p><p>|\n/i).map(l => l.replace(/<[^>]*>?/gm, '').trim()).filter(l => l);
            let html = '';
            lines.forEach((line, index) => {
                // If line starts with a number and a dot, e.g., "1. Preheat"
                let match = line.match(/^(\d+)\.\s*(.*)/);
                if (match) {
                    html += `<div class="method-step"><span class="num">${match[1]}</span><p class="txt">${match[2]}</p></div>`;
                } else {
                    html += `<div class="method-step"><span class="num">${index + 1}</span><p class="txt">${line}</p></div>`;
                }
            });
            methodEl.innerHTML = html;
        }
    }

    // 6. Populate Related Recipes from Session Storage or API
    const relatedWrapper = document.getElementById('nx-recipe-related-wrapper');
    if (relatedWrapper) {
        let allRecipes = [];
        const cache = sessionStorage.getItem('nx_recipes_cache');
        
        if (cache) {
            allRecipes = JSON.parse(cache);
            renderRelatedRecipes(allRecipes);
        } else {
            fetchRecipesForRelated().then(recipes => {
                if (recipes) {
                    renderRelatedRecipes(recipes);
                }
            });
        }
        
        function renderRelatedRecipes(recipesData) {
            const currentPath = window.location.pathname;
            const currentRecipe = recipesData.find(r => r.url === currentPath);
            
            let related = recipesData.filter(r => r.url !== currentPath);
            
            // Filter to only siblings in the same category
            if (currentRecipe && currentRecipe.parentEntityId) {
                related = related.filter(r => r.parentEntityId === currentRecipe.parentEntityId);
            }
            
            related = related.slice(0, 6);
            
            let html = '';
            related.forEach(r => {
                const mainBadge = r.badges && r.badges.length > 0 ? r.badges[0] : 'Recipe';
                html += `
                    <div class="swiper-slide">
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
                    </div>
                `;
            });
            relatedWrapper.innerHTML = html;
        }

        async function fetchRecipesForRelated() {
            if (!window.stencilStorefrontToken) return null;
            
            let pages = [];
            let hasNextPage = true;
            let cursor = '';
            let loopCount = 0;

            // Only fetch a couple of pages since we only need 6 related
            while (hasNextPage && loopCount < 2) {
                loopCount++;
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
                                            parentEntityId
                                            name
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
                    if (!json.data || !json.data.site || !json.data.site.content) break;
                    
                    const data = json.data.site.content.pages;
                    data.edges.forEach(edge => pages.push(edge.node));

                    hasNextPage = data.pageInfo.hasNextPage;
                    cursor = data.pageInfo.endCursor;
                } catch (error) {
                    console.error("Error fetching GraphQL pages:", error);
                    break;
                }
            }

            const parsedRecipes = [];
            pages.forEach(node => {
                if (node.htmlBody && node.htmlBody.includes('[RECIPE IMAGE]')) {
                    const html = node.htmlBody;
                    let strippedHtml = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>?/gm, '').trim();
                    
                    let imageMatch = html.match(/\[RECIPE IMAGE\][\s\S]*?<img[^>]+src="([^">]+)"/i);
                    let image = imageMatch ? imageMatch[1] : '';

                    let timeMatch = strippedHtml.match(/Cook Time:\s*(.+?)(?:\n|$)/i);
                    let cookTime = timeMatch ? timeMatch[1].trim() : '1 hr';

                    let ratingMatch = strippedHtml.match(/Rating:\s*([\d.]+)/i);
                    let rating = ratingMatch ? ratingMatch[1].trim() : '4.8';

                    let badgesMatch = strippedHtml.match(/Tags:\s*(.+?)(?:\n|$)/i);
                    let badges = badgesMatch ? badgesMatch[1].split(',').map(b => b.trim()) : [];

                    parsedRecipes.push({
                        title: node.name,
                        url: node.path,
                        image: image,
                        cookTime: cookTime,
                        rating: rating,
                        badges: badges,
                        parentEntityId: node.parentEntityId
                    });
                }
            });
            
            // Save to cache so next time it's faster
            if (parsedRecipes.length > 0) {
                sessionStorage.setItem('nx_recipes_cache', JSON.stringify(parsedRecipes));
            }
            return parsedRecipes;
        }
    }

    // 7. Initialize Swiper for Related Recipes
    const sliderSelector = '.nx-related-recipes-swiper';
    const sliderEl = document.querySelector(sliderSelector);

    if (sliderEl) {
        new Swiper(sliderSelector, {
            modules: [Navigation],
            observer: true,
            observeParents: true,
            slidesPerView: 1,
            spaceBetween: 16,
            navigation: {
                nextEl: '.nx-recipe-arrows .nx-next-btn',
                prevEl: '.nx-recipe-arrows .nx-prev-btn',
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                    spaceBetween: 16,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 16,
                },
            },
        });
    }
}
