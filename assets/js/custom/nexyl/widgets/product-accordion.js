import $ from 'jquery';

export default function initProductAccordionWidget() {
    // We use Event Delegation on the document because Page Builder 
    // injects the widget HTML dynamically after the page loads.
    $(document).on('click', '.nx-widget-accordion .nx-pdp-acc-trigger', function() {
        const $trigger = $(this);
        const $content = $trigger.next('.nx-pdp-acc-content');
        const $acc = $trigger.closest('.nx-widget-accordion');
        
        const isOpen = $content.is(':visible');
        
        // Smoothly close all other open accordions in this widget
        $acc.find('.nx-pdp-acc-content').slideUp(300);
        $acc.find('.nx-pdp-plus-path').show();
        $acc.find('.nx-pdp-minus-path').hide();
        
        // Smoothly open the clicked one if it wasn't already open
        if (!isOpen) {
            $content.slideDown(300);
            $trigger.find('.nx-pdp-plus-path').hide();
            $trigger.find('.nx-pdp-minus-path').show();
        }
    });
}
