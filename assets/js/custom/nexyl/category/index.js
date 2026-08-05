import initAllItems from './all-items';
import initCustomFilters from './custom-filters';

export default function initCategoryCustom() {
    initAllItems();
    initCustomFilters();

    // Filters toggle logic
    const filterToggle = document.querySelector('.nx-filters-toggle');
    const filterDropdown = document.getElementById('faceted-search-container');

    if (filterToggle && filterDropdown) {
        filterToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = filterDropdown.classList.toggle('is-open');
            filterToggle.setAttribute('aria-expanded', isOpen);
        });

        document.addEventListener('click', (e) => {
            if (!filterDropdown.contains(e.target) && !filterToggle.contains(e.target)) {
                filterDropdown.classList.remove('is-open');
                filterToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Tabs toggle logic
    const tabsToggle = document.querySelector('.nx-tabs-toggle');
    const tabsMenu = document.getElementById('nx-tabs-menu');

    if (tabsToggle && tabsMenu) {
        tabsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = tabsMenu.classList.toggle('is-open');
            tabsToggle.setAttribute('aria-expanded', isOpen);
        });

        document.addEventListener('click', (e) => {
            if (!tabsMenu.contains(e.target) && !tabsToggle.contains(e.target)) {
                tabsMenu.classList.remove('is-open');
                tabsToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}
