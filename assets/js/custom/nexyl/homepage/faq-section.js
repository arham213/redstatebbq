export default function initFaqSection() {
    const triggers = document.querySelectorAll('[data-faq-trigger]');
    if (!triggers.length) return;

    triggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.nx-acc-item');
            if (item) {
                item.classList.toggle('nx-open');
            }
        });
    });
}
