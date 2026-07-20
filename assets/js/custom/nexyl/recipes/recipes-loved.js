import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

export default function initRecipesLoved() {
    const wrapper = document.getElementById('recipes-loved-wrapper');
    if (!wrapper) return;

    // Static data for 'Recipes Loved by All' Testimonials
    const testimonials = [
        {
            name: "David Carroll",
            avatar: "", // Empty or a URL
            quote: "We’ve had regional sauces on the tables at Red State for 13 years. For America’s 250th birthday, I wanted to make one sauce that represented the whole country."
        },
        {
            name: "Sarah Jenkins",
            avatar: "",
            quote: "This brisket recipe is absolutely incredible. The rub balance is perfect, and it came out so tender!"
        },
        {
            name: "Michael Thompson",
            avatar: "",
            quote: "I've been looking for the perfect pulled chicken recipe for years. Red State BBQ nailed it with this one."
        }
    ];

    // Build the DOM
    let html = '';
    testimonials.forEach(test => {
        const avatarHtml = test.avatar ? `<img src="${test.avatar}" alt="${test.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />` : '';
        html += `
            <div class="swiper-slide">
                <div class="test-quote-row" style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="test-person">
                        <div class="avatar">${avatarHtml}</div>
                        <div class="test-name">${test.name}</div>
                    </div>
                    <p class="test-quote">&ldquo;${test.quote}&rdquo;</p>
                </div>
            </div>
        `;
    });
    wrapper.innerHTML = html;

    // Initialize Swiper
    new Swiper('.swiper-recipes-loved', {
        modules: [Navigation, Pagination],
        slidesPerView: 1,
        spaceBetween: 20,
        navigation: {
            nextEl: '.rl-next',
            prevEl: '.rl-prev',
        }
    });
}
