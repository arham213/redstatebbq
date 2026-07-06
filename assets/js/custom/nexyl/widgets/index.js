import initProductAccordionWidget from './product-accordion';

export default function initWidgetsCustom() {
    // Only initialize the accordion widget on the product page
    if (document.querySelector('.nx-pdp-product-intro')) {
        initProductAccordionWidget();
    }
}
