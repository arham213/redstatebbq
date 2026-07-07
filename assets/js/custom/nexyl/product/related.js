export default function initRelated() {
    var DESKTOP_BP = 769;  /* matches SCSS mobile breakpoint */
    var CARDS_TO_SHOW = 3;
    var SCROLL_DUR = 380;  /* ms */

    var shell = document.getElementById('nx-related-slider-shell');
    var grid = document.getElementById('nx-related-grid');
    if (!shell || !grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.nx-sauce'));
    var totalCards = cards.length;

    if (totalCards <= CARDS_TO_SHOW) return;

    var prevBtn = document.createElement('button');
    prevBtn.className = 'nx-related-arrow nx-ba-prev nx-ba-hidden';
    prevBtn.setAttribute('aria-label', 'Previous products');
    prevBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><path d="M32 58.6663C46.7276 58.6663 58.6667 46.7273 58.6667 31.9997C58.6667 17.2721 46.7276 5.33301 32 5.33301C17.2724 5.33301 5.33337 17.2721 5.33337 31.9997C5.33337 46.7273 17.2724 58.6663 32 58.6663Z" stroke="#2C2929" stroke-width="4" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M35.3601 41.4136L25.9734 32.0002L35.3601 22.5869" stroke="#2C2929" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var nextBtn = document.createElement('button');
    nextBtn.className = 'nx-related-arrow nx-ba-next';
    nextBtn.setAttribute('aria-label', 'Next products');
    nextBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><path d="M32 58.6663C46.7276 58.6663 58.6667 46.7273 58.6667 31.9997C58.6667 17.2721 46.7276 5.33301 32 5.33301C17.2724 5.33301 5.33337 17.2721 5.33337 31.9997C5.33337 46.7273 17.2724 58.6663 32 58.6663Z" stroke="#2C2929" stroke-width="4" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M28.64 41.4136L38.0267 32.0002L28.64 22.5869" stroke="#2C2929" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var viewport = document.createElement('div');
    viewport.className = 'nx-related-viewport';
    grid.parentNode.insertBefore(viewport, grid);
    viewport.appendChild(grid);

    var navContainer = document.createElement('div');
    navContainer.className = 'nx-related-slider-nav';
    shell.appendChild(navContainer);
    navContainer.appendChild(prevBtn);
    navContainer.appendChild(nextBtn);

    var currentIndex = 0;
    var isScrolling = false;

    function maxIndex() { return totalCards - CARDS_TO_SHOW; }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function smoothScrollTo(target) {
        var start = viewport.scrollLeft;
        var dist = target - start;
        var t0 = null;
        isScrolling = true;
        function step(ts) {
            if (!t0) t0 = ts;
            var p = Math.min((ts - t0) / SCROLL_DUR, 1);
            viewport.scrollLeft = start + dist * ease(p);
            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                isScrolling = false;
            }
        }
        requestAnimationFrame(step);
    }

    function goTo(idx) {
        currentIndex = Math.max(0, Math.min(idx, maxIndex()));
        var cardW = cards[0].offsetWidth + 30; /* card width + gap */
        smoothScrollTo(currentIndex * cardW);
        updateArrows();
    }

    function updateArrows() {
        prevBtn.classList.toggle('nx-ba-hidden', currentIndex <= 0);
        nextBtn.classList.toggle('nx-ba-hidden', currentIndex >= maxIndex());
    }

    prevBtn.addEventListener('click', function () { goTo(currentIndex - 1); });
    nextBtn.addEventListener('click', function () { goTo(currentIndex + 1); });

    viewport.addEventListener('scroll', function () {
        if (isScrolling) return;
        var cardW = cards[0].offsetWidth + 30;
        currentIndex = Math.round(viewport.scrollLeft / cardW);
        updateArrows();
    }, { passive: true });

    function activate() {
        shell.classList.add('is-slider');
        goTo(currentIndex);
    }

    function deactivate() {
        shell.classList.remove('is-slider');
        viewport.scrollLeft = 0;
        currentIndex = 0;
    }

    function check() {
        window.innerWidth >= DESKTOP_BP ? activate() : deactivate();
    }

    check();

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(check, 120);
    });
}
