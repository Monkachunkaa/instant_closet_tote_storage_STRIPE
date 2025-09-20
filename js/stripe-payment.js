/**
 * STRIPE PAYMENT INTEGRATION - MAIN MODULE
 * 
 * This module handles Stripe initialization and order processing for the
 * Instant Closet Tote Storage payment system. It creates real payment intents
 * and processes actual payments with subscription creation.
 * 
 * Dependencies: stripe-modal.js, stripe-handlers.js, pricing.js, forms.js
 * 
 * @author Stripe Integration Team
 * @version 3.0.0 - Real payment processing with subscriptions
 */

// Stripe configuration - Your publishable key from Stripe dashboard
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51S97oj5Kox27LmidNTlRscpdkrwht2RJeriPo1ncNkAgVg4NPtVkecLWV9UZ8dBpulUR6h21BkAaKhGT1AazcpDD00T7kESfvJ';

// Global Stripe instance - initialized on page load
let stripe = null;

/**
 * Initialize Stripe on page load
 * Creates the global Stripe instance using the publishable key
 * @returns {boolean} True if initialization successful, false otherwise
 */
function initializeStripe() {
    try {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        console.log('✅ Stripe initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Stripe:', error);
        // Show error to user if showPaymentError function is available
        if (typeof showPaymentError === 'function') {
            showPaymentError('Failed to load payment system. Please refresh and try again.');
        }
        return false;
    }
}

/**
 * Process order form submission and show payment modal
 * 
 * This function is called when the hero form is submitted. It validates
 * the form data, calculates the total cost, and opens the payment modal.
 * This replaces the original EmailJS submission for the order form.
 * 
 * @param {HTMLFormElement} form - The form element that was submitted
 * @param {HTMLElement} messageDiv - Element to display error messages
 */
function processOrderSubmission(form, messageDiv) {
    console.log('🚀 Processing order submission...');
    
    // Extract form data
    const formData = new FormData(form);
    
    // Calculate total cost using pricing.js function
    const totalCost = getOrderCost ? getOrderCost(form) : 0;
    
    // Validate cost calculation
    if (totalCost <= 0) {
        console.warn('⚠️ Invalid cost calculation:', totalCost);
        showMessage(messageDiv, '❌ Please enter a valid number of totes (2-10) to calculate cost.', 'error');
        return;
    }
    
    // Create order data object
    const orderData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        toteNumber: parseInt(formData.get('tote_number')),
        totalCost: totalCost
    };
    
    // Validate all required fields are present
    if (!orderData.name || !orderData.email || !orderData.phone || 
        !orderData.address || !orderData.toteNumber) {
        console.warn('⚠️ Missing required fields:', orderData);
        showMessage(messageDiv, '❌ Please fill in all required fields.', 'error');
        return;
    }
    
    console.log('✅ Order validation passed:', orderData);
    
    // Open payment modal (function defined in stripe-modal.js)
    showPaymentModal(orderData);
}

/**
 * Initialize the payment system
 * 
 * Called when the DOM is loaded. Sets up Stripe and initializes
 * all necessary event listeners for the payment modal.
 */
function initializePaymentSystem() {
    console.log('🔧 Initializing payment system...');
    
    // Initialize Stripe first
    const stripeReady = initializeStripe();
    
    if (stripeReady) {
        // Initialize modal event listeners (function defined in stripe-modal.js)
        if (typeof initializeModalEventListeners === 'function') {
            initializeModalEventListeners();
        }
        console.log('✅ Payment system initialized successfully');
    } else {
        console.error('❌ Payment system initialization failed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePaymentSystem);

// Export functions to global scope for use by other modules
window.processOrderSubmission = processOrderSubmission;