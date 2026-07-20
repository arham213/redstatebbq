import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

export default function initTestimonialSlider() {
    const swiperContainer = document.querySelector('.nx-testimonial-swiper');
    
    if (swiperContainer) {
        new Swiper('.nx-testimonial-swiper', {
            modules: [Navigation],
            slidesPerView: 1,
            loop: true,
            navigation: {
                nextEl: '.nx-testimonial-next',
                prevEl: '.nx-testimonial-prev',
            },
        });
    }
}
