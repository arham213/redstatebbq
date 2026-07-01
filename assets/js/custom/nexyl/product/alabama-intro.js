import $ from 'jquery';

export default function initAlabamaIntro() {
    const $intro = $('.nx-pdp-alabama-intro');
    if (!$intro.length) return;

    // Gallery functionality
    const $heroImg = $intro.find('#nx-pdp-hero-img-container img');
    const $thumbs = $intro.find('.nx-pdp-thumb');

    $thumbs.on('click', function() {
        const $this = $(this);
        const newSrc = $this.data('image-url');
        if (newSrc) {
            $heroImg.attr('src', newSrc);
            $thumbs.removeClass('is-selected');
            $this.addClass('is-selected');
        }
    });

    // Accordion functionality
    const $accTriggers = $intro.find('.nx-pdp-acc-trigger');
    $accTriggers.on('click', function() {
        const $this = $(this);
        const $parent = $this.closest('.nx-pdp-acc-item');
        const $content = $this.siblings('.nx-pdp-acc-content');

        if ($parent.hasClass('is-open')) {
            $content.slideUp(300);
            $parent.removeClass('is-open');
            $this.find('.nx-pdp-plus-path').show();
            $this.find('.nx-pdp-minus-path').hide();
        } else {
            // Close other open tabs
            const $siblings = $parent.siblings('.is-open');
            $siblings.find('.nx-pdp-acc-content').slideUp(300);
            $siblings.removeClass('is-open');
            $siblings.find('.nx-pdp-plus-path').show();
            $siblings.find('.nx-pdp-minus-path').hide();

            $content.slideDown(300);
            $parent.addClass('is-open');
            $this.find('.nx-pdp-plus-path').hide();
            $this.find('.nx-pdp-minus-path').show();
        }
    });

    // Quantity functionality
    const $qtyInput = $intro.find('.nx-pdp-qty-input');
    const $qtyPlus = $intro.find('.nx-pdp-qty-plus');
    const $qtyMinus = $intro.find('.nx-pdp-qty-minus');

    $qtyPlus.on('click', function() {
        let val = parseInt($qtyInput.val(), 10) || 1;
        $qtyInput.val(val + 1).trigger('change');
    });

    $qtyMinus.on('click', function() {
        let val = parseInt($qtyInput.val(), 10) || 1;
        if (val > 1) {
            $qtyInput.val(val - 1).trigger('change');
        }
    });

    // Format rating to 1 decimal place without rounding up (e.g., 5 -> 5.0, 4.89 -> 4.8)
    const $ratingText = $intro.find('.nx-pdp-rating-meta span').first();
    if ($ratingText.length) {
        const rawRating = parseFloat($ratingText.text().trim());
        if (!isNaN(rawRating)) {
            const truncated = Math.floor(rawRating * 10) / 10;
            $ratingText.text(truncated.toFixed(1));
        }
    }
}
