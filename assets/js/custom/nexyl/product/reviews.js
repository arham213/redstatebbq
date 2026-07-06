export default function initReviews() {
    /* ─── Relative date helper ─── */
    function timeAgo(dateString) {
        if (!dateString) return '';
        const cleanDate = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
        const date = new Date(cleanDate);
        if (isNaN(date.getTime())) return dateString;
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return 'Just now';
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 }
        ];
        for (var i = 0; i < intervals.length; i++) {
            var count = Math.floor(seconds / intervals[i].seconds);
            if (count >= 1) return count + ' ' + intervals[i].label + (count > 1 ? 's' : '') + ' ago';
        }
        return dateString;
    }

    function initRelativeDates() {
        document.querySelectorAll('.nx-pdp-review-date').forEach(function (el) {
            var rawDate = el.getAttribute('data-review-date');
            if (rawDate) {
                var relative = timeAgo(rawDate);
                if (relative !== rawDate) el.textContent = relative;
            }
        });
    }

    /* ─── Custom Pagination Logic ─── */
    var REVIEWS_PER_PAGE = 5;

    function initReviewPagination() {
        var container = document.getElementById('nx-review-list-container');
        var paginationNav = document.getElementById('nx-reviews-pagination');
        if (!container || !paginationNav) return;

        // Collect ALL review articles currently in the DOM
        var allReviews = Array.prototype.slice.call(container.querySelectorAll('article.nx-pdp-review'));
        if (allReviews.length === 0) return;

        var totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);

        // Only show pagination when there is more than one page
        if (totalPages <= 1) {
            paginationNav.style.display = 'none';
            return;
        }

        var currentPage = 1;

        function showPage(page, skipScroll) {
            currentPage = page;
            var start = (page - 1) * REVIEWS_PER_PAGE;
            var end = start + REVIEWS_PER_PAGE;

            allReviews.forEach(function (el, idx) {
                el.style.display = (idx >= start && idx < end) ? '' : 'none';
            });

            renderPagination();
            initRelativeDates();

            // Smooth-scroll to the top of the review list on every page change
            // except the initial bootstrap call (skipScroll = true)
            if (!skipScroll) {
                requestAnimationFrame(function () {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }
        }

        function renderPagination() {
            paginationNav.style.display = 'flex';
            paginationNav.innerHTML = '';

            /* Prev button */
            var prevBtn = document.createElement('button');
            prevBtn.className = 'nx-rpg-btn nx-rpg-arrow';
            prevBtn.setAttribute('aria-label', 'Previous page');
            prevBtn.innerHTML = '&#8592;';
            prevBtn.disabled = (currentPage === 1);
            prevBtn.addEventListener('click', function () {
                if (currentPage > 1) showPage(currentPage - 1);
            });
            paginationNav.appendChild(prevBtn);

            /* Page number buttons with ellipsis logic */
            var pages = buildPageList(currentPage, totalPages);
            pages.forEach(function (p) {
                if (p === '...') {
                    var ellipsis = document.createElement('span');
                    ellipsis.className = 'nx-rpg-ellipsis';
                    ellipsis.textContent = '…';
                    paginationNav.appendChild(ellipsis);
                } else {
                    var btn = document.createElement('button');
                    btn.className = 'nx-rpg-btn' + (p === currentPage ? ' nx-rpg-active' : '');
                    btn.textContent = p;
                    btn.setAttribute('aria-label', 'Page ' + p);
                    if (p === currentPage) btn.setAttribute('aria-current', 'page');
                    (function (pageNum) {
                        btn.addEventListener('click', function () {
                            if (pageNum !== currentPage) showPage(pageNum);
                        });
                    }(p));
                    paginationNav.appendChild(btn);
                }
            });

            /* Next button */
            var nextBtn = document.createElement('button');
            nextBtn.className = 'nx-rpg-btn nx-rpg-arrow';
            nextBtn.setAttribute('aria-label', 'Next page');
            nextBtn.innerHTML = '&#8594;';
            nextBtn.disabled = (currentPage === totalPages);
            nextBtn.addEventListener('click', function () {
                if (currentPage < totalPages) showPage(currentPage + 1);
            });
            paginationNav.appendChild(nextBtn);
        }

        /* Build compact page list: always show first, last, current ±1, with ellipsis */
        function buildPageList(cur, total) {
            if (total <= 7) {
                var list = [];
                for (var i = 1; i <= total; i++) list.push(i);
                return list;
            }
            var pages = [];
            var delta = 1; // pages around current
            var left = cur - delta;
            var right = cur + delta;
            var range = [];
            var withDots = [];
            var l;

            for (var i = 1; i <= total; i++) {
                if (i === 1 || i === total || (i >= left && i <= right)) range.push(i);
            }

            range.forEach(function (i) {
                if (l) {
                    if (i - l === 2) {
                        withDots.push(l + 1);
                    } else if (i - l !== 1) {
                        withDots.push('...');
                    }
                }
                withDots.push(i);
                l = i;
            });

            return withDots;
        }

        // Bootstrap: show page 1 without scrolling (page is just loading)
        showPage(1, true);
    }

    // ── Exact Rating Calculation ──
    function initExactRating() {
        var container = document.querySelector('.nx-pdp-reviews-section');
        if (!container) return;

        var numReviews = parseInt(container.getAttribute('data-num-reviews') || '0', 10);
        var productRating = parseFloat(container.getAttribute('data-product-rating') || '5');

        var staticReviews = parseInt(container.getAttribute('data-static-reviews') || '0', 10);
        var staticSum = parseInt(container.getAttribute('data-static-sum') || '0', 10);

        var totalReviews = numReviews + staticReviews;
        var totalSum = (numReviews * productRating) + staticSum;
        var exactRating = totalReviews > 0 ? (totalSum / totalReviews) : 4.8;

        var formattedRating = exactRating.toFixed(1);
        var els = document.querySelectorAll('.js-exact-rating');
        for (var i = 0; i < els.length; i++) {
            els[i].innerText = formattedRating;
        }
    }

    initRelativeDates();
    initReviewPagination();
    initExactRating();
}
