/* global Foundation */
import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.dropdown';
import utils from '@bigcommerce/stencil-utils';
import 'slick-carousel';

export const CartPreviewEvents = {
    close: 'closed.fndtn.dropdown',
    open: 'opened.fndtn.dropdown',
};

export default function (secureBaseUrl, cartId) {
    const loadingClass = 'is-loading';
    const $cart = $('[data-cart-preview]');
    const $cartDropdown = $('#cart-preview-dropdown');
    const $cartLoading = $('<div class="loadingOverlay"></div>');
    let bestsellersHtml = '';

    function initSlider($cards) {
        if ($.fn.slick) {
            $cards.slick({
                infinite: false,
                slidesToShow: 2,
                slidesToScroll: 2,
                arrows: true,
                dots: false,
                speed: 500,
                cssEase: 'cubic-bezier(0.25, 1, 0.5, 1)',
                useTransform: true,
                useCSS: true,
                appendArrows: $('.nx-cd-arrows', $cartDropdown),
                prevArrow: '<button class="nx-cd-arrow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>',
                nextArrow: '<button class="nx-cd-arrow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
            });
        }
    }


    let featuredHtml = '';
    let isShowingBestsellers = true;
    let alternateInterval = null;

    function renderProducts() {
        const $cards = $cartDropdown.find('.nx-cd-cards');
        const $title = $cartDropdown.find('.nx-cd-also h3');

        function updateSlider(html) {
            if ($cards.hasClass('slick-initialized')) $cards.slick('unslick');
            $cards.html(html);
            initSlider($cards);
        }

        function cycleProducts() {
            if (isShowingBestsellers && featuredHtml.trim()) {
                updateSlider(featuredHtml);
                isShowingBestsellers = false;
            } else if (!isShowingBestsellers && bestsellersHtml.trim()) {
                updateSlider(bestsellersHtml);
                isShowingBestsellers = true;
            }
        }

        if (bestsellersHtml && featuredHtml) {
            updateSlider(bestsellersHtml);
            isShowingBestsellers = true;
            if (alternateInterval) clearInterval(alternateInterval);
            alternateInterval = setInterval(cycleProducts, 180000);
            return;
        }

        let loadedCount = 0;

        utils.api.getPage('/', { template: 'common/cart-preview-bestsellers' }, (err, response) => {
            if (!err) bestsellersHtml = response;
            loadedCount++;
            if (loadedCount === 2) startCycle();
        });

        utils.api.getPage('/', { template: 'common/cart-preview-featured' }, (err, response) => {
            if (!err) featuredHtml = response;
            loadedCount++;
            if (loadedCount === 2) startCycle();
        });

        function startCycle() {
            if (bestsellersHtml.trim()) {
                updateSlider(bestsellersHtml);
                isShowingBestsellers = true;
            } else if (featuredHtml.trim()) {
                updateSlider(featuredHtml);
                isShowingBestsellers = false;
            }

            if (bestsellersHtml.trim() && featuredHtml.trim()) {
                if (alternateInterval) clearInterval(alternateInterval);
                alternateInterval = setInterval(cycleProducts, 180000);
            }
        }
    }

    const $body = $('body');

    if (window.ApplePaySession) {
        $cartDropdown.addClass('apple-pay-supported');
    }

    $body.on('cart-quantity-update', (event, quantity, newTotal) => {
        $cart.attr('aria-label', (_, prevValue) => prevValue.replace(/\d+/, quantity));

        if (!quantity) {
            $cart.addClass('navUser-item--cart__hidden-s');
            $('.nx-cart-total').text('$0.00');
        } else {
            $cart.removeClass('navUser-item--cart__hidden-s');
            if (newTotal) {
                $('.nx-cart-total').text(newTotal);
            } else {
                $.get('/api/storefront/carts', (carts) => {
                    if (carts && carts.length > 0) {
                        const amount = carts[0].cartAmount;
                        const currency = carts[0].currency.code || 'USD';
                        const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
                        $('.nx-cart-total').text(formatted);
                    }
                });
            }
        }

        $('.cart-quantity')
            .text(quantity)
            .toggleClass('countPill--positive', quantity > 0);
        if (utils.tools.storage.localStorageAvailable()) {
            localStorage.setItem('cart-quantity', quantity);
        }
    });

    $cart.on('click', event => {
        const options = {
            template: 'common/cart-preview',
            baseUrl: secureBaseUrl,
        };

        // Redirect to full cart page has been removed to allow drawer on all screens

        event.preventDefault();

        $cartDropdown.addClass(loadingClass).html('<div class="previewCartWrapper nx-cart-drawer"><div class="nx-cd-loading-wrap"></div></div>');
        $cartDropdown.find('.nx-cart-drawer > div').append($cartLoading);
        $cartLoading
            .show();

        utils.api.cart.getContent(options, (err, response) => {
            $cartDropdown
                .removeClass(loadingClass)
                .html(response);
            $cartLoading
                .hide();
            renderProducts();
        });
    });

    // Handle Cart Drawer overlay and close button
    $cartDropdown.on('opened.fndtn.dropdown', () => {
        $('#nx-cart-overlay').addClass('is-open');
        $('body, html').addClass('nx-scroll-locked');
    });

    $cartDropdown.on('closed.fndtn.dropdown', () => {
        $('#nx-cart-overlay').removeClass('is-open');
        $('body, html').removeClass('nx-scroll-locked');
    });

    $body.on('click', '#nx-cart-close-btn, #nx-cart-overlay, #nx-cart-continue-btn', (e) => {
        e.preventDefault();
        Foundation.libs.dropdown.close($cartDropdown);
        $cartDropdown.removeClass('is-open');
        $('#nx-cart-overlay').removeClass('is-open');
        $('body, html').removeClass('nx-scroll-locked');
    });

    // Prevent clicks inside the cart from closing the drawer
    $cartDropdown.on('click', (e) => {
        // Allow close buttons to bubble up to the body listener
        if ($(e.target).closest('#nx-cart-close-btn, #nx-cart-continue-btn').length > 0) {
            return;
        }
        // We only want to prevent closing the dropdown. Links inside should still work normally.
        e.stopPropagation();
    });

    // Handle asynchronous item removal from the cart drawer
    $cartDropdown.on('click', '.previewCartItem-remove', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const itemId = $(e.currentTarget).data('productId');

        $cartDropdown.addClass(loadingClass);
        $cartDropdown.find('.nx-cart-drawer').append($cartLoading);
        $cartLoading.show();

        utils.api.cart.itemRemove(itemId, (err, response) => {
            const newQuantity = (response && response.data && response.data.status === 'succeed') ? (response.data.cart.quantity || 0) : null;

            // Fetch the updated cart HTML to re-render the drawer contents
            const options = {
                template: 'common/cart-preview',
                baseUrl: secureBaseUrl,
            };

            utils.api.cart.getContent(options, (contentErr, previewHtml) => {
                $cartDropdown
                    .removeClass(loadingClass)
                    .html(previewHtml);
                $cartLoading.hide();

                const newTotal = $(previewHtml).find('.nx-cd-lrtxt').text();

                if (newQuantity !== null) {
                    $body.trigger('cart-quantity-update', [newQuantity, newTotal]);
                } else if (newTotal) {
                    $('.nx-cart-total').text(newTotal);
                }
            });
        });
    });

    // Handle quantity stepper
    $cartDropdown.on('click', '[data-cart-preview-update]', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const $target = $(e.currentTarget);
        const itemId = $target.data('cartItemid');
        const action = $target.data('action');
        const $count = $target.siblings('.nx-cd-count');

        const currentQty = parseInt($count.text(), 10);
        if (Number.isNaN(currentQty)) return;

        const newQty = action === 'inc' ? currentQty + 1 : currentQty - 1;

        if (newQty <= 0) {
            // Treat as remove
            $cartDropdown.addClass(loadingClass);
            $cartDropdown.find('.nx-cart-drawer').append($cartLoading);
            $cartLoading.show();
            utils.api.cart.itemRemove(itemId, (err, response) => {
                const newQuantity = (response && response.data && response.data.status === 'succeed') ? (response.data.cart.quantity || 0) : null;

                const options = { template: 'common/cart-preview', baseUrl: secureBaseUrl };
                utils.api.cart.getContent(options, (contentErr, previewHtml) => {
                    $cartDropdown.removeClass(loadingClass).html(previewHtml);
                    $cartLoading.hide();
                    renderProducts();
                    const newTotal = $(previewHtml).find('.nx-cd-lrtxt').text();

                    if (newQuantity !== null) {
                        $body.trigger('cart-quantity-update', [newQuantity, newTotal]);
                    } else if (newTotal) {
                        $('.nx-cart-total').text(newTotal);
                    }
                });
            });
            return;
        }

        $cartDropdown.addClass(loadingClass);
        $cartDropdown.find('.nx-cart-drawer').append($cartLoading);
        $cartLoading.show();

        utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
            const newQuantity = (response && response.data && response.data.status === 'succeed') ? (response.data.cart.quantity || 0) : null;

            const options = { template: 'common/cart-preview', baseUrl: secureBaseUrl };
            utils.api.cart.getContent(options, (contentErr, previewHtml) => {
                $cartDropdown.removeClass(loadingClass).html(previewHtml);
                $cartLoading.hide();
                renderProducts();
                const newTotal = $(previewHtml).find('.nx-cd-lrtxt').text();

                if (newQuantity !== null) {
                    $body.trigger('cart-quantity-update', [newQuantity, newTotal]);
                } else if (newTotal) {
                    $('.nx-cart-total').text(newTotal);
                }
            });
        });
    });

    let quantity = 0;

    if (cartId) {
        // Get existing quantity from localStorage if found
        if (utils.tools.storage.localStorageAvailable()) {
            if (localStorage.getItem('cart-quantity')) {
                quantity = Number(localStorage.getItem('cart-quantity'));
                $body.trigger('cart-quantity-update', quantity);
            }
        }

        // Get updated cart quantity from the Cart API
        const cartQtyPromise = new Promise((resolve, reject) => {
            utils.api.cart.getCartQuantity({ baseUrl: secureBaseUrl, cartId }, (err, qty) => {
                if (err) {
                    // If this appears to be a 404 for the cart ID, set cart quantity to 0
                    if (err === 'Not Found') {
                        resolve(0);
                    } else {
                        reject(err);
                    }
                }
                resolve(qty);
            });
        });

        // If the Cart API gives us a different quantity number, update it
        cartQtyPromise.then(qty => {
            quantity = qty;
            $body.trigger('cart-quantity-update', quantity);
        });
    } else {
        $body.trigger('cart-quantity-update', quantity);
    }
}
