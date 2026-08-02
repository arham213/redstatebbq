import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';

export default function initGallery() {
    const gallerySwiperEl = document.querySelector('.nx-gallery-swiper');
    if (!gallerySwiperEl) return;

    new Swiper('.nx-gallery-swiper', {
        modules: [Autoplay],
        slidesPerView: 'auto',
        spaceBetween: 16,
        centeredSlides: true,
        loop: true,
        speed: 4000,
        autoplay: {
            delay: 0,
            disableOnInteraction: false,
        },
        breakpoints: {
            570: {
                slidesPerView: 2,
                spaceBetween: 16,
                centeredSlides: false,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 24,
                centeredSlides: false,
            },
            1025: {
                slidesPerView: 4.5,
                spaceBetween: 12,
                centeredSlides: true,
            }
        }
    });
}
