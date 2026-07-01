export default function initReviewsBreakdown() {
    const wrapper = document.querySelector('[data-reviews-list]');
    if (!wrapper) return;

    const rawList = wrapper.getAttribute('data-reviews-list');
    if (!rawList) return;

    // Parse the ratings string "5,4,5," into an array of integers
    const ratings = rawList.split(',').filter(Boolean).map(r => parseInt(r, 10));
    if (ratings.length === 0) return;

    const pageTotal = ratings.length;
    
    // Get the true total number of reviews on the product from the section wrapper
    const section = document.querySelector('.nx-pdp-reviews-section');
    let productTotal = pageTotal;
    if (section) {
        const numReviews = parseInt(section.getAttribute('data-num-reviews') || '0', 10);
        const staticReviews = parseInt(section.getAttribute('data-static-reviews') || '0', 10);
        const trueTotal = numReviews + staticReviews;
        if (trueTotal > 0) {
            productTotal = trueTotal;
        }
    }

    // Count the frequencies of each star rating on the current page
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
        if (counts[r] !== undefined) counts[r]++;
    });

    // Project the page percentages onto the total reviews to provide realistic breakdown data
    [5, 4, 3, 2, 1].forEach(star => {
        const row = wrapper.querySelector(`[data-rating-row="${star}"]`);
        if (row) {
            const countEl = row.querySelector('.js-rating-count');
            const fillEl = row.querySelector('.js-rating-fill');
            
            const pageCount = counts[star];
            const percentage = pageTotal > 0 ? (pageCount / pageTotal) : 0;
            const projectedCount = Math.round(percentage * productTotal);
            
            if (countEl) countEl.textContent = projectedCount;
            if (fillEl) fillEl.style.width = `${percentage * 100}%`;
        }
    });
}
