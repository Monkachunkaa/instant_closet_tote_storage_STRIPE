/**
 * FORM HANDLING
 * Hero form and contact form functionality
 * Depends on: pricing.js (for getOrderCost function)
 */

// Show form message utility
function showMessage(messageDiv, message, type) {
    messageDiv.innerHTML = `<div class="form-message ${type}">${message}</div>`;
    
    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Clear message after time based on type
    const clearTime = type === 'success' ? 8000 : 0; // Keep error messages
    if (clearTime > 0) {
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, clearTime);
    }
}

// Clear form message utility
function clearMessage(messageDiv) {
    messageDiv.innerHTML = '';
}

// Generic form submission handler
function handleFormSubmission(form, messageDiv, templateId) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear any existing messages
        clearMessage(messageDiv);
        
        // Check if this is the hero form (order form) that should use Stripe
        if (form.id === 'hero-form') {
            // Use Stripe payment flow for hero form
            if (typeof processOrderSubmission === 'function') {
                processOrderSubmission(form, messageDiv);
            } else {
                console.error('Stripe payment system not loaded');
                showMessage(messageDiv, '❌ Payment system not loaded. Please refresh and try again.', 'error');
            }
            return;
        }
        
        // Handle other forms (contact form) with original EmailJS flow
        handleRegularFormSubmission(form, messageDiv, templateId);
    });
}

// Original form submission handler for non-payment forms
function handleRegularFormSubmission(form, messageDiv, templateId) {
    // Get form elements
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Sending...';
    
    // Get form data
    const formData = new FormData(form);
    
    // Get order cost from pricing calculator (if available)
    const orderCost = getOrderCost ? getOrderCost(form) : 0;
    
    // Prepare template parameters
    const templateParams = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        tote_number: formData.get('tote_number'),
        message: formData.get('message') || 'No additional details provided',
        order_cost: orderCost > 0 ? `${orderCost}` : 'Not calculated'
    };
    
    // Send email using EmailJS
    emailjs.send('honeybee_gmail_service', templateId, templateParams)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            
            // Show success message
            const successMsg = templateId === 'ICTS_lead' 
                ? '🎉 Thank you! Your request has been submitted successfully. We\'ll contact you within 24 hours to schedule your first delivery.'
                : '🎉 Thank you! We\'ll contact you within 24 hours to schedule your first delivery.';
            
            showMessage(messageDiv, successMsg, 'success');
            
            // Reset form
            form.reset();
            
        }, function(error) {
            console.log('FAILED...', error);
            
            // Show error message
            showMessage(messageDiv, '❌ Sorry, there was an error sending your message. Please try again or contact us directly at (828) 455-7793.', 'error');
        })
        .finally(function() {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        });
}

// Clear error messages when user starts typing
function initFormErrorClearing(form, messageDiv) {
    const formFields = form.querySelectorAll('input, textarea');
    formFields.forEach(field => {
        field.addEventListener('input', function() {
            const errorMessage = messageDiv.querySelector('.form-message.error');
            if (errorMessage) {
                clearMessage(messageDiv);
            }
        });
    });
}

// Initialize hero form (on index page)
function initHeroForm() {
    const heroForm = document.querySelector('#hero-form');
    const heroMessageDiv = document.getElementById('hero-form-message');
    
    if (heroForm && heroMessageDiv) {
        handleFormSubmission(heroForm, heroMessageDiv, 'ICTS_lead');
        initFormErrorClearing(heroForm, heroMessageDiv);
    }
}

// Initialize contact form (on contact page)
function initContactForm() {
    const contactForm = document.querySelector('#contact-form');
    const contactMessageDiv = document.getElementById('form-message');
    
    if (contactForm && contactMessageDiv) {
        handleFormSubmission(contactForm, contactMessageDiv, 'ICTS_lead');
        initFormErrorClearing(contactForm, contactMessageDiv);
    }
}

// Check URL parameters for form focus (contact page)
function checkFormFocus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('focus') === 'form') {
        // Wait for page to fully load
        setTimeout(() => {
            // Scroll to form with smooth animation
            const formContainer = document.querySelector('.contact-form-container');
            
            if (formContainer) {
                // Scroll to show the top of the form container
                formContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Focus on first form field after scroll
                setTimeout(() => {
                    const firstField = document.querySelector('#name');
                    if (firstField) {
                        firstField.focus();
                    }
                }, 800); // Wait for scroll to complete
            }
        }, 100);
    }
}

// Initialize all form functionality
function initForms() {
    initHeroForm();
    initContactForm();
    checkFormFocus();
}

// Run on DOM content loaded
document.addEventListener('DOMContentLoaded', initForms);

// Also run on window load for form focus
window.addEventListener('load', checkFormFocus);
