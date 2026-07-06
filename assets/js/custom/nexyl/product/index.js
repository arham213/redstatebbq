import initReviews from './reviews';
import initReviewsBreakdown from './reviews-breakdown';
import initProductIntro from './product-intro';

export default function initProductCustom() {
    // Only run if the reviews section exists on the page
    if (document.querySelector('.nx-pdp-reviews-section')) {
        initReviews();
        initReviewsBreakdown();
    }

    if (document.querySelector('.nx-pdp-product-intro')) {
        initProductIntro();
    }
}
