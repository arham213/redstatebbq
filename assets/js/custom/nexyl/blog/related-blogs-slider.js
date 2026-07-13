import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

export default function initRelatedBlogsSlider() {
    const sliderSelector = '.nx-related-blogs-swiper';
    const sliderEl = document.querySelector(sliderSelector);

    if (!sliderEl) {
        return;
    }

    new Swiper(sliderSelector, {
        modules: [Navigation],
        slidesPerView: 1,
        spaceBetween: 16,
        navigation: {
            nextEl: '.nx-related-arrows .swiper-button-next',
            prevEl: '.nx-related-arrows .swiper-button-prev',
        },
        breakpoints: {
            768: {
                slidesPerView: 2,
                spaceBetween: 16,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 16,
            },
        },
    });
}
