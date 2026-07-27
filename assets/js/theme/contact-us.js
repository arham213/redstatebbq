import PageManager from './page-manager';
import nod from './common/nod';
import forms from './common/models/forms';
import { announceInputErrorMessage } from './common/utils/form-utils';

export default class ContactUs extends PageManager {
    onReady() {
        this.registerContactFormValidation();

        // Automatically scroll to the form if a success or error message is present
        const $formCard = $('.nx-contact-form-card, .nx-wholesale__form-card');
        const hasMessage = $('#contact-us-success').length > 0 || $('#contact-us-error').length > 0;

        if (hasMessage && $formCard.length > 0) {
            // Restore height to prevent CLS dynamically
            const savedHeight = sessionStorage.getItem('submittedFormHeight');
            const savedHtml = sessionStorage.getItem('submittedFormHtml');
            
            if (savedHeight && $('#contact-us-success').length > 0) {
                $('#contact-us-success').css('min-height', `${savedHeight}px`);
                
                // Allow the card to stretch if it was using flex, or enforce min-height on card
                $formCard.css('min-height', `${savedHeight}px`);

                // Restore the missing HTML fields that the backend stripped
                if (savedHtml) {
                    $('#contact-us-form-wrapper').html(savedHtml);
                }

                // Hide success message and show form back after 5 seconds
                setTimeout(() => {
                    $('#contact-us-success').fadeOut(400, () => {
                        $formCard.css('min-height', ''); // remove dynamic height
                        $('#contact-us-form-wrapper').fadeIn(400);
                        
                        // Re-register validation for the newly injected DOM elements
                        this.registerContactFormValidation();
                    });
                }, 5000);
            }
            sessionStorage.removeItem('submittedFormHeight');
            sessionStorage.removeItem('submittedFormHtml');

            $('html, body').animate({
                scrollTop: $formCard.offset().top - 100
            }, 600);
        }
    }

    registerContactFormValidation() {
        const formSelector = 'form[data-contact-form]';
        const contactUsValidator = nod({
            submit: `${formSelector} input[type="submit"]`,
            tap: announceInputErrorMessage,
        });
        const $contactForm = $(formSelector);

        contactUsValidator.add([
            {
                selector: `${formSelector} input[name="contact_email"]`,
                validate: (cb, val) => {
                    const result = forms.email(val);

                    cb(result);
                },
                errorMessage: this.context.contactEmail,
            },
            {
                selector: `${formSelector} textarea[name="contact_question"]`,
                validate: (cb, val) => {
                    const result = forms.notEmpty(val);

                    cb(result);
                },
                errorMessage: this.context.contactQuestion,
            },
        ]);

        $contactForm.on('submit', event => {
            contactUsValidator.performCheck();

            if (contactUsValidator.areAll('valid')) {
                // Capture the exact height of the form card right before submit to prevent CLS on page reload
                const $formCard = $('.nx-contact-form-card, .nx-wholesale__form-card');
                if ($formCard.length > 0) {
                    sessionStorage.setItem('submittedFormHeight', $formCard.outerHeight());
                }

                // Capture the complete form HTML to restore it since the backend strips conditionally rendered fields on success
                const $wrapper = $('#contact-us-form-wrapper');
                if ($wrapper.length > 0) {
                    const $clone = $wrapper.clone();
                    // Clear the input values in the clone so it appears empty when restored
                    $clone.find('form')[0].reset(); 
                    sessionStorage.setItem('submittedFormHtml', $clone.html());
                }

                // Wholesale Form Logic
                const $wholesaleMessage = $('#wholesale_contact_question');
                if ($wholesaleMessage.length > 0) {
                    const cityState = $('#custom_city_state').val().trim();
                    const location = $('#custom_location').val().trim();
                    const baseMessage = $wholesaleMessage.val();
                    
                    let finalMessage = baseMessage;
                    if (cityState) finalMessage += `\n\nCity & State: ${cityState}`;
                    if (location) finalMessage += `\nLocation: ${location}`;
                    
                    $wholesaleMessage.val(finalMessage);
                    return;
                }

                // Standard Contact Form Logic
                const $subject = $('#custom_contact_subject');
                const $message = $('#contact_question');
                
                if ($subject.length > 0 && $message.length > 0) {
                    const subjectVal = $subject.val().trim();
                    const messageVal = $message.val();

                    if (subjectVal !== '') {
                        // Create a hidden input for the actual submission to hide the merged text from the user
                        let $hiddenMessage = $('#hidden_contact_question');
                        if ($hiddenMessage.length === 0) {
                            $hiddenMessage = $('<input type="hidden" id="hidden_contact_question" name="contact_question">');
                            $contactForm.append($hiddenMessage);
                        }

                        $hiddenMessage.val(`Subject: ${subjectVal}\n\n${messageVal}`);
                        // Remove the name attribute from the visible textarea so it doesn't submit and override the hidden one
                        $message.removeAttr('name');
                    }
                }

                return;
            }

            event.preventDefault();
        });
    }
}
