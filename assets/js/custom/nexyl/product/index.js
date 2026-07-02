import init1776Reviews from './1776-reviews';
import initReviewsBreakdown from './reviews-breakdown';
import initProductIntro from './product-intro';

export default function initProductCustom() {
    // Only run if the reviews section exists on the page
    if (document.querySelector('.nx-pdp-reviews-section')) {
        init1776Reviews();
        initReviewsBreakdown();
    }

    if (document.querySelector('.nx-pdp-product-intro')) {
        initProductIntro();
    }
}
