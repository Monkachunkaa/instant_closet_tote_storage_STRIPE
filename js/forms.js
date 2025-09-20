/**
 * FORM HANDLING - OPTIMIZED VERSION
 * Consolidated hero and contact form functionality
 * Depends on: pricing.js (for getOrderCost function)
 * 
 * @version 2.1.0 - Added enhanced address validation (10 char minimum)
 */

// Form utilities
const FormUtils = {
    /**
     * Show form message utility
     * @param {HTMLElement} messageDiv - Message container element
     * @param {string} message - Message text to display
     * @param {string} type - Message type ('success' or 'error')
     */
    showMessage: function(messageDiv, message, type) {
        messageDiv.innerHTML = `<div class="form-message ${type}">${message}</div>`;
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-clear success messages after 8 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 8000);
        }
    },

    /**
     * Clear form message utility
     * @param {HTMLElement} messageDiv - Message container element
     */
    clearMessage: function(messageDiv) {
        messageDiv.innerHTML = '';
    },

    /**
     * Set button loading state
     * @param {HTMLElement} button - Submit button element
     * @param {boolean} loading - Whether button should show loading state
     * @param {string} originalText - Original button text to restore
     */
    setButtonLoading: function(button, loading, originalText = 'Submit') {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<span class="loading-spinner"></span>Sending...';
        } else {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    },

    /**
     * Extract form data into an object
     * @param {HTMLFormElement} form - Form element
     * @returns {Object} Form data object
     */
    extractFormData: function(form) {
        const formData = new FormData(form);
        return {
            name: formData.get('name'),
            email: formData.get('email'), 
            phone: formData.get('phone'),
            address: formData.get('address') || 'Not provided',
            tote_number: formData.get('tote_number') || 'Not specified',
            message: formData.get('message') || 'No additional details provided'
        };
    }
};

/**
 * Handle form submission routing
 * Determines whether to process as order (Stripe) or contact (EmailJS)
 * @param {HTMLFormElement} form - Form element that was submitted
 * @param {HTMLElement} messageDiv - Message container element
 */
function handleFormSubmission(form, messageDiv) {
    // Clear any existing messages
    FormUtils.clearMessage(messageDiv);
    
    // Route based on form type
    if (form.id === 'hero-contact-form') {
        // Hero form = order processing with Stripe payment
        handleOrderSubmission(form, messageDiv);
    } else {
        // Contact form = direct EmailJS submission
        handleContactSubmission(form, messageDiv);
    }
}

/**
 * Handle order form submission (hero form)
 * Routes to Stripe payment system
 * @param {HTMLFormElement} form - Order form element
 * @param {HTMLElement} messageDiv - Message container element
 */
function handleOrderSubmission(form, messageDiv) {
    console.log('🚀 Processing order submission...');
    
    // Validate Stripe integration is available
    if (typeof processOrderSubmission !== 'function') {
        console.error('Stripe payment system not loaded');
        FormUtils.showMessage(messageDiv, '❌ Payment system not loaded. Please refresh and try again.', 'error');
        return;
    }
    
    // Calculate total cost
    const totalCost = getOrderCost ? getOrderCost(form) : 0;
    
    if (totalCost <= 0) {
        console.warn('⚠️ Invalid cost calculation:', totalCost);
        FormUtils.showMessage(messageDiv, '❌ Please enter a valid number of totes (2-10) to calculate cost.', 'error');
        return;
    }
    
    // Extract and validate form data
    const formData = FormUtils.extractFormData(form);
    
    if (!formData.name || !formData.email || !formData.phone || 
        !formData.address || formData.address === 'Not provided' || formData.address.length < 10 ||
        !formData.tote_number || formData.tote_number === 'Not specified') {
        console.warn('⚠️ Missing required fields for order:', formData);
        FormUtils.showMessage(messageDiv, '❌ Please fill in all required fields. Address must be at least 10 characters.', 'error');
        return;
    }
    
    // Create order data object for Stripe
    const orderData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        toteNumber: parseInt(formData.tote_number),
        totalCost: totalCost
    };
    
    console.log('✅ Order validation passed:', orderData);
    
    // Track analytics
    if (window.AnalyticsTracker) {
        window.AnalyticsTracker.trackFormSubmission('hero', formData);
    }
    
    // Route to Stripe payment system (function from stripe-payment.js)
    processOrderSubmission(form, messageDiv);
}

/**
 * Handle contact form submission (contact page)
 * Sends directly via EmailJS
 * @param {HTMLFormElement} form - Contact form element
 * @param {HTMLElement} messageDiv - Message container element
 */
function handleContactSubmission(form, messageDiv) {
    console.log('📧 Processing contact form submission...');
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    // Set loading state
    FormUtils.setButtonLoading(submitBtn, true);
    
    // Extract form data
    const formData = FormUtils.extractFormData(form);
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
        FormUtils.showMessage(messageDiv, '❌ Please fill in all required fields.', 'error');
        FormUtils.setButtonLoading(submitBtn, false, originalBtnText);
        return;
    }
    
    // Track analytics
    if (window.AnalyticsTracker) {
        window.AnalyticsTracker.trackFormSubmission('contact', formData);
    }
    
    // Get order cost if available (for contact forms with tote fields)
    const orderCost = getOrderCost ? getOrderCost(form) : 0;
    
    // Prepare EmailJS template parameters
    const templateParams = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        tote_number: formData.tote_number,
        message: formData.message,
        order_cost: orderCost > 0 ? `${orderCost}` : 'Not calculated'
    };
    
    // Send email using EmailJS
    emailjs.send('honeybee_gmail_service', 'ICTS_lead', templateParams)
        .then(function(response) {
            console.log('✅ Contact form sent successfully:', response.status);
            
            // Show success message
            const successMsg = (formData.address !== 'Not provided' && formData.tote_number !== 'Not specified') 
                ? '🎉 Thank you! Your request has been submitted successfully. We\'ll contact you within 24 hours to schedule your first delivery.'
                : '🎉 Thank you! Your message has been submitted successfully. We\'ll contact you within 24 hours.';
            
            FormUtils.showMessage(messageDiv, successMsg, 'success');
            
            // Reset form
            form.reset();
            
        }, function(error) {
            console.error('❌ Contact form failed:', error);
            FormUtils.showMessage(messageDiv, '❌ Sorry, there was an error sending your message. Please try again or contact us directly at (828) 455-7793.', 'error');
        })
        .finally(function() {
            // Restore button state
            FormUtils.setButtonLoading(submitBtn, false, originalBtnText);
        });
}

/**
 * Initialize enhanced form validation with real-time feedback
 * @param {HTMLFormElement} form - Form element
 * @param {HTMLElement} messageDiv - Message container element
 */
function initFormValidation(form, messageDiv) {
    const addressField = form.querySelector('input[name="address"]');
    
    if (addressField) {
        // Add real-time validation for address field
        addressField.addEventListener('input', function() {
            const value = this.value.trim();
            
            // Clear any existing error messages when user starts typing
            const errorMessage = messageDiv.querySelector('.form-message.error');
            if (errorMessage) {
                FormUtils.clearMessage(messageDiv);
            }
            
            // Show character count feedback
            this.setCustomValidity('');
            
            if (value.length > 0 && value.length < 10) {
                this.setCustomValidity(`Address must be at least 10 characters (${value.length}/10)`);
            }
        });
        
        // Show validation message on blur
        addressField.addEventListener('blur', function() {
            const value = this.value.trim();
            
            if (this.hasAttribute('required') && value.length > 0 && value.length < 10) {
                FormUtils.showMessage(messageDiv, `⚠️ Address must be at least 10 characters. Current: ${value.length} characters.`, 'error');
            }
        });
    }
}

/**
 * Initialize form focus from URL parameters (contact page)
 * Handles ?focus=form parameter for direct form linking
 */
function initFormFocus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('focus') === 'form') {
        // Wait for page to fully load
        setTimeout(() => {
            const formContainer = document.querySelector('.contact-form-container');
            
            if (formContainer) {
                // Scroll to form with smooth animation
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
                }, 800);
            }
        }, 100);
    }
}

/**
 * Initialize all forms on the page
 * Sets up event listeners and form-specific functionality
 */
function initForms() {
    // Initialize hero form (index page)
    const heroForm = document.querySelector('#hero-contact-form');
    const heroMessageDiv = document.getElementById('hero-form-message');
    
    if (heroForm && heroMessageDiv) {
        heroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(heroForm, heroMessageDiv);
        });
        initFormValidation(heroForm, heroMessageDiv);
        console.log('✅ Hero form initialized for order processing');
    }
    
    // Initialize contact form (contact page)
    const contactForm = document.querySelector('#contact-form');
    const contactMessageDiv = document.getElementById('form-message');
    
    if (contactForm && contactMessageDiv) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(contactForm, contactMessageDiv);
        });
        initFormValidation(contactForm, contactMessageDiv);
        console.log('✅ Contact form initialized for EmailJS submission');
    }
    
    // Initialize form focus functionality
    initFormFocus();
}

// Legacy function exports for backward compatibility
// These maintain the same API as the old forms.js for other modules
function showMessage(messageDiv, message, type) {
    FormUtils.showMessage(messageDiv, message, type);
}

function clearMessage(messageDiv) {
    FormUtils.clearMessage(messageDiv);
}

// Initialize forms on DOM content loaded
document.addEventListener('DOMContentLoaded', initForms);

// Also initialize form focus on window load (for URL parameters)
window.addEventListener('load', initFormFocus);