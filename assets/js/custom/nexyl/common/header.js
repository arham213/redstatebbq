export default function initHeaderCustom() {
    // Mobile Menu Toggle Logic
    const mobileToggle = document.getElementById('nx-mobile-toggle');
    const mobileMenu = document.getElementById('nx-mobile-menu');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', function () {
            mobileMenu.classList.toggle('is-open');
            mobileToggle.classList.toggle('is-active');
            if (mobileMenu.classList.contains('is-open')) {
                document.documentElement.classList.add('nx-scroll-locked');
                document.body.classList.add('nx-scroll-locked');
            } else {
                document.documentElement.classList.remove('nx-scroll-locked');
                document.body.classList.remove('nx-scroll-locked');
            }
        });
    }

    // Drop Bar Countdown Timer Logic
    const dropBarTimer = document.getElementById('nx-drop-bar-timer');
    if (dropBarTimer) {
        // Countdown to July 4, 2026 midnight EDT (UTC-4) — last day of the 1776 Independence Blend
        const target = new Date('2026-07-04T00:00:00-04:00').getTime();

        function pad(n) { return String(n).padStart(2, '0'); }

        function tick() {
            let diff = target - Date.now();
            if (diff <= 0) {
                diff = 0;
                clearInterval(intervalId);
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            const secs = Math.floor((diff / 1000) % 60);

            dropBarTimer.textContent = `${days} d • ${pad(hours)} hrs • ${pad(mins)} min • ${pad(secs)} sec`;
        }

        tick();
        const intervalId = setInterval(tick, 1000);
    }
}
