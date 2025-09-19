/**
 * STRIPE PAYMENT INTEGRATION - MAIN MODULE
 * Handles Stripe initialization and Stripe Checkout integration
 * Depends on: stripe-modal.js, stripe-handlers.js, pricing.js
 */

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51S97oj5Kox27LmidNTlRscpdkrwht2RJeriPo1ncNkAgVg4NPtVkecLWV9UZ8dBpulUR6h21BkAaKhGT1AazcpDD00T7kESfvJ';

// Global Stripe variables
let stripe = null;
let currentOrderData = null;

/**
 * Initialize Stripe on page load
 */
function initializeStripe() {
    try {
        // Initialize Stripe with your publishable key
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        console.log('Stripe initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        showPaymentError('Failed to load payment system. Please refresh and try again.');
        return false;
    }
}

/**
 * Create a payment intent using a mock server endpoint
 * This simulates what would happen on your server
 * @param {Object} orderData - Order information
 * @returns {Promise<string>} Client secret
 */
async function createPaymentIntent(orderData) {
    try {
        // This simulates a server call that would create a payment intent
        // In production, this would be a real API call to your server
        
        console.log('Creating payment intent for:', orderData);
        
        // Simulate server processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For demo purposes, we'll create a properly formatted mock client secret
        // This mimics the format that Stripe uses: pi_[id]_secret_[secret]
        const paymentIntentId = `pi_demo_${Date.now()}`;
        const secretPart = Math.random().toString(36).substr(2, 24); // 24 char secret
        const mockClientSecret = `${paymentIntentId}_secret_${secretPart}`;
        
        console.log('Mock payment intent created with client secret:', mockClientSecret);
        
        return mockClientSecret;
        
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw new Error('Failed to create payment intent');
    }
}

/**
 * Create Stripe Elements with payment intent
 * @param {Object} orderData - Order information
 * @returns {Promise<Object>} Stripe Elements instance
 */
async function createPaymentElements(orderData) {
    try {
        // Create payment intent (simulated)
        const clientSecret = await createPaymentIntent(orderData);
        
        // Create elements instance with the client secret
        const elements = stripe.elements({
            clientSecret: clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#F8CF1F',
                    colorBackground: '#ffffff',
                    colorText: '#30313d',
                    colorDanger: '#df1b41',
                    fontFamily: 'Source Sans Pro, system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px'
                }
            }
        });
        
        return { elements, clientSecret };
        
    } catch (error) {
        console.error('Error creating payment elements:', error);
        throw error;
    }
}

/**
 * Process form submission and show payment modal
 * This function replaces the original form submission in forms.js
 * @param {HTMLFormElement} form - The form element
 * @param {HTMLElement} messageDiv - Message display element
 */
function processOrderSubmission(form, messageDiv) {
    // Get form data
    const formData = new FormData(form);
    
    // Get calculated cost from pricing.js
    const totalCost = getOrderCost ? getOrderCost(form) : 0;
    
    if (totalCost <= 0) {
        showMessage(messageDiv, '❌ Please enter a valid number of totes (2-10) to calculate cost.', 'error');
        return;
    }
    
    // Prepare order data
    const orderData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        toteNumber: parseInt(formData.get('tote_number')),
        totalCost: totalCost
    };
    
    // Validate required fields
    if (!orderData.name || !orderData.email || !orderData.phone || !orderData.address || !orderData.toteNumber) {
        showMessage(messageDiv, '❌ Please fill in all required fields.', 'error');
        return;
    }
    
    // Store current order data
    currentOrderData = orderData;
    
    // Show payment modal (defined in stripe-modal.js)
    showPaymentModal(orderData);
}

/**
 * Initialize payment system
 */
function initializePaymentSystem() {
    // Initialize Stripe
    const stripeReady = initializeStripe();
    
    if (stripeReady) {
        // Initialize modal event listeners (defined in stripe-modal.js)
        initializeModalEventListeners();
        console.log('Payment system initialized successfully');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePaymentSystem);

// Export functions for global access
window.processOrderSubmission = processOrderSubmission;
window.createPaymentElements = createPaymentElements;