import utils from '@bigcommerce/stencil-utils';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

export default function initAllItems() {
    const pageContainer = document.querySelector('.nx-all-items-page');
    if (!pageContainer) return;

    // Initialize Filter Functionality
    const filters = document.querySelectorAll('.nx-category-filters .filter');
    const sections = document.querySelectorAll('.nx-subcategory-section, .split-banner, .community');
    const toggleBtn = document.querySelector('.nx-category-filters__toggle');
    const toggleText = document.querySelector('.nx-category-filters__toggle-text');
    const filterMenu = document.querySelector('.nx-category-filters__menu');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !isExpanded);
            if (filterMenu) {
                filterMenu.classList.toggle('is-open');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            if (isExpanded && filterMenu && !toggleBtn.contains(e.target) && !filterMenu.contains(e.target)) {
                toggleBtn.setAttribute('aria-expanded', 'false');
                filterMenu.classList.remove('is-open');
            }
        });
    }

    filters.forEach(filter => {
        filter.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const filterValue = target.getAttribute('data-filter');

            // Update active state
            filters.forEach(f => f.classList.remove('active'));
            target.classList.add('active');

            // Update dropdown toggle text and close menu on mobile
            if (toggleText) {
                toggleText.textContent = target.textContent;
            }
            if (toggleBtn && filterMenu) {
                toggleBtn.setAttribute('aria-expanded', 'false');
                filterMenu.classList.remove('is-open');
            }

            // Optionally scroll to section or show/hide
            if (filterValue === 'all') {
                sections.forEach(s => s.style.display = '');
            } else {
                // If it's scrolling behavior:
                const targetSection = document.getElementById(filterValue);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Fetch Products dynamically for each subcategory
    const subcategorySections = document.querySelectorAll('.nx-subcategory-section[data-category-url]');
    
    subcategorySections.forEach(section => {
        const urlsString = section.getAttribute('data-category-url');
        const swiperContainer = section.querySelector('.nx-category-swiper, .nx-promo-swiper');
        if (!urlsString || !swiperContainer) return;

        const wrapper = swiperContainer.querySelector('.nx-products-wrapper');
        const templateType = swiperContainer.getAttribute('data-card-template');
        const template = templateType === 'bundle' 
            ? 'custom/nexyl/category/ajax-products-bundle' 
            : 'custom/nexyl/category/ajax-products-standard';

        const urls = urlsString.split(',').map(u => u.trim()).filter(u => u);

        const fetchPromises = urls.map(url => {
            return new Promise((resolve, reject) => {
                utils.api.getPage(url, { template: template }, (err, response) => {
                    if (err || !response) {
                        console.error('Failed to load products for', url, err);
                        resolve(''); // resolve empty so it doesn't break others
                    } else {
                        resolve(response);
                    }
                });
            });
        });

        Promise.all(fetchPromises).then(responses => {
            const combinedHtml = responses.join('');
            
            if (!combinedHtml) {
                wrapper.innerHTML = '<p>Failed to load products.</p>';
                return;
            }

            // Swap out skeletons with real products
            wrapper.innerHTML = combinedHtml;

            // Initialize Swiper
            const navContainer = swiperContainer.querySelector('.nx-swiper-nav');
            const swiperInstance = new Swiper(swiperContainer, {
                modules: [Navigation],
                slidesPerView: 'auto',
                spaceBetween: 20,
                centerInsufficientSlides: true,
                navigation: {
                    nextEl: swiperContainer.querySelector('.nx-swiper-next'),
                    prevEl: swiperContainer.querySelector('.nx-swiper-prev'),
                },
                breakpoints: {
                    570: {
                        slidesPerView: 2,
                    },
                    768: {
                        slidesPerView: 3,
                    },
                    1024: {
                        slidesPerView: templateType === 'bundle' ? 3 : 4,
                        spaceBetween: 30,
                    },
                    1200: {
                        slidesPerView: templateType === 'bundle' ? 3 : 5,
                        spaceBetween: 30,
                    }
                },
                on: {
                    init: function () {
                        if (this.isLocked && navContainer) {
                            navContainer.style.display = 'none';
                        }
                    },
                    lock: function () {
                        if (navContainer) navContainer.style.display = 'none';
                    },
                    unlock: function () {
                        if (navContainer) navContainer.style.display = 'flex';
                    }
                }
            });

            // Fallback check right after initialization
            if (swiperInstance.isLocked && navContainer) {
                navContainer.style.display = 'none';
            }
        });
    });
}
