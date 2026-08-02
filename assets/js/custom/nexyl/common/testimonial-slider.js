import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';

export default function initTestimonialSlider() {
    const swiperContainer = document.querySelector('.nx-testimonial-swiper');

    if (swiperContainer) {
        new Swiper('.nx-testimonial-swiper', {
            modules: [Pagination, Autoplay],
            slidesPerView: 1,
            loop: true,
            speed: 1500,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            pagination: {
                el: '.nx-testimonial-pagination',
                clickable: true,
            },
        });
    }
}
