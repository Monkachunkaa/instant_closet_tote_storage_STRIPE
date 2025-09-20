/**
 * STRIPE PAYMENT MODAL
 * 
 * This module handles the payment modal display, order summary presentation,
 * and Stripe Elements initialization. It creates a professional payment
 * interface using real Stripe payment intents via Netlify functions.
 * 
 * Dependencies: stripe-payment.js, stripe-handlers.js
 * 
 * @author Stripe Integration Team
 * @version 2.0.0 - Now with real payment intent integration
 */

/**
 * Display error message in the payment modal
 * @param {string} message - Error message to display to user
 */
function showPaymentError(message) {
    const errorElement = document.getElementById('payment-errors');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        console.warn('⚠️ Payment Error:', message);
    }
}

/**
 * Hide any displayed payment error messages
 */
function hidePaymentError() {
    const errorElement = document.getElementById('payment-errors');
    if (errorElement) {
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }
}

/**
 * Show the payment modal with customer order details
 * 
 * Displays order summary and initializes Stripe Elements for payment processing.
 * Now uses real payment intents for actual payment processing.
 * 
 * @param {Object} orderData - Customer order information
 * @param {string} orderData.name - Customer name
 * @param {string} orderData.email - Customer email
 * @param {string} orderData.phone - Customer phone
 * @param {string} orderData.address - Customer address
 * @param {number} orderData.toteNumber - Number of totes ordered
 * @param {number} orderData.totalCost - Total cost in dollars
 */
async function showPaymentModal(orderData) {
    console.log('💳 Opening payment modal for order:', orderData);
    
    // Track payment initiation in analytics
    if (window.AnalyticsTracker) {
        window.AnalyticsTracker.trackPaymentStart(orderData);
    }
    
    // Get modal elements
    const modal = document.getElementById('payment-modal');
    const orderDetails = document.getElementById('order-details');
    const totalAmount = document.getElementById('total-amount');
    
    // Validate required DOM elements exist
    if (!modal || !orderDetails || !totalAmount) {
        console.error('❌ Payment modal elements not found in DOM');
        return;
    }
    
    // Build order summary HTML
    orderDetails.innerHTML = `
        <div class="order-detail-item">
            <span class="order-detail-label">Customer:</span>
            <span class="order-detail-value">${orderData.name}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Email:</span>
            <span class="order-detail-value">${orderData.email}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Phone:</span>
            <span class="order-detail-value">${orderData.phone}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Address:</span>
            <span class="order-detail-value">${orderData.address}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Number of Totes:</span>
            <span class="order-detail-value">${orderData.toteNumber}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">Setup Cost:</span>
            <span class="order-detail-value">$${orderData.totalCost} ($20 trip fee + $${orderData.toteNumber * 10} first month)</span>
        </div>
    `;
    
    // Update total amount display
    totalAmount.textContent = `$${orderData.totalCost}`;
    
    // Show modal with CSS animation
    modal.style.display = 'flex';
    
    // Initialize Stripe payment form with real payment intent
    await initializePaymentForm(orderData);
}

/**
 * Initialize Stripe Elements payment form with real payment intent
 * 
 * Creates a real Stripe payment intent via Netlify function, then
 * initializes Stripe Elements with the returned client secret.
 * This enables real payment processing instead of demo simulation.
 * 
 * @param {Object} orderData - Customer order information
 */
async function initializePaymentForm(orderData) {
    // Validate Stripe is initialized
    if (typeof stripe === 'undefined' || !stripe) {
        console.error('❌ Stripe not initialized');
        showPaymentError('Payment system not loaded. Please refresh and try again.');
        return;
    }
    
    // Get payment element container
    const paymentElementContainer = document.getElementById('payment-element');
    if (!paymentElementContainer) {
        console.error('❌ Payment element container not found in DOM');
        showPaymentError('Payment form container not found. Please refresh and try again.');
        return;
    }
    
    try {
        console.log('🔧 Creating real payment intent on server...');
        
        // Show loading message while creating payment intent
        paymentElementContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: #666;">Loading payment form...</div>';
        
        // Call Netlify function to create real payment intent
        console.log('🌐 Attempting to call:', '/.netlify/functions/create-payment-intent');
        
        const response = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: orderData.totalCost * 100, // Convert to cents
                orderData: orderData
            })
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('📡 Response body:', errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.error) {
            // Handle specific error types
            if (data.code === 'RATE_LIMIT_EXCEEDED') {
                throw new Error('Too many payment attempts. Please wait a minute and try again.');
            } else if (data.code === 'VALIDATION_ERROR') {
                throw new Error(`Order validation failed: ${data.error}`);
            } else {
                throw new Error(data.error);
            }
        }

        const clientSecret = data.client_secret;
        console.log('✅ Payment intent created, initializing Stripe Elements...');

        // Clear loading message
        paymentElementContainer.innerHTML = '';

        // Create Stripe Elements with real client secret
        const elements = stripe.elements({
            clientSecret: clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#F8CF1F',      // Brand yellow
                    colorBackground: '#ffffff',    // White background
                    colorText: '#30313d',         // Dark text
                    colorDanger: '#df1b41',       // Red for errors
                    fontFamily: 'Source Sans Pro, system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px'
                }
            }
        });

        // Create and mount payment element with specific payment methods
        const paymentElement = elements.create('payment', {
            paymentMethodTypes: ['card', 'apple_pay', 'google_pay']
        });
        
        console.log('📦 Mounting payment element to DOM...');
        paymentElement.mount('#payment-element');

        // Store references globally for payment processing
        window.currentElements = elements;
        window.currentPaymentElement = paymentElement;
        window.currentClientSecret = clientSecret;
        window.currentOrderData = orderData;

        // Set up event listeners for payment element
        paymentElement.on('ready', () => {
            console.log('✅ Payment element ready with REAL Stripe integration!');
        });

        paymentElement.on('change', (event) => {
            if (event.error) {
                console.error('⚠️ Payment element validation error:', event.error);
                showPaymentError(event.error.message);
            } else {
                // Clear any previous errors when user fixes input
                hidePaymentError();
            }
        });

        console.log('✅ Real payment form initialization completed');
        
    } catch (error) {
        console.error('❌ Error initializing real payment form:', error);
        showPaymentError('Failed to load payment form. Please try again.');
        
        // Fallback error message for user
        paymentElementContainer.innerHTML = `
            <div style="padding: 1rem; text-align: center; color: #666;">
                <p>Payment form failed to load. Please refresh the page and try again.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem; color: #999;">Error: ${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #F8CF1F; border: none; border-radius: 5px; cursor: pointer;">Refresh Page</button>
            </div>
        `;
    }
}

/**
 * Close the payment modal and clean up
 * 
 * Hides the modal, destroys Stripe elements, and resets the modal
 * content for future use.
 */
function closePaymentModal() {
    console.log('🚪 Closing payment modal...');
    
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clean up Stripe elements to prevent memory leaks
    if (typeof window.currentPaymentElement !== 'undefined' && window.currentPaymentElement) {
        window.currentPaymentElement.destroy();
        window.currentPaymentElement = null;
    }
    
    if (typeof window.currentElements !== 'undefined' && window.currentElements) {
        window.currentElements = null;
    }
    
    // Clear order data and client secret
    if (typeof window.currentOrderData !== 'undefined') {
        window.currentOrderData = null;
    }
    
    if (typeof window.currentClientSecret !== 'undefined') {
        window.currentClientSecret = null;
    }
    
    // Reset modal content for next use
    resetModalContent();
    
    console.log('✅ Payment modal closed and cleaned up');
}

/**
 * Reset modal content to original state
 * 
 * Restores the modal HTML to its initial state and re-attaches
 * event listeners for future use.
 */
function resetModalContent() {
    const modalBody = document.querySelector('.payment-modal-body');
    
    if (!modalBody) {
        console.warn('⚠️ Modal body not found for reset');
        return;
    }
    
    // Restore original modal HTML structure
    modalBody.innerHTML = `
        <div class="order-summary">
            <h4>Order Summary</h4>
            <div id="order-details"></div>
            <div class="total-cost">
                <strong>Total: <span id="total-amount">$0</span></strong>
            </div>
        </div>
        <div class="payment-form">
            <div id="payment-element">
                <!-- Stripe Elements will create form elements here -->
            </div>
            <div id="payment-errors" role="alert"></div>
            <button id="payment-submit" class="btn btn-primary payment-submit-btn">
                <div class="spinner hidden" id="payment-spinner"></div>
                <span id="payment-button-text">Complete Payment</span>
            </button>
        </div>
    `;
    
    // Re-attach event listeners for the reset modal
    initializeModalEventListeners();
}

/**
 * Display payment success confirmation
 * 
 * Replaces the payment form with a success message, subscription details,
 * and instructions for the customer.
 */
function showPaymentSuccess() {
    console.log('🎉 Displaying payment success message');
    
    const modalBody = document.querySelector('.payment-modal-body');
    
    if (!modalBody) {
        console.warn('⚠️ Modal body not found for success display');
        return;
    }
    
    // Build subscription information
    let subscriptionSection = '';
    
    if (window.currentSubscriptionData) {
        const nextBillingDate = new Date(window.currentSubscriptionData.next_billing_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });
        
        subscriptionSection = `
            <div class="subscription-info">
                <h4>🔄 Monthly Subscription Active</h4>
                <p><strong>Monthly Amount:</strong> ${window.currentSubscriptionData.monthly_amount}</p>
                <p><strong>Next Billing Date:</strong> ${nextBillingDate}</p>
                <p><strong>Subscription ID:</strong> ${window.currentSubscriptionData.subscription_id}</p>
                <div class="manage-subscription">
                    <p>You can manage your subscription anytime:</p>
                    <button onclick="openManageSubscription()" class="btn btn-secondary manage-btn">
                        Manage Subscription
                    </button>
                </div>
            </div>
        `;
    } else if (window.subscriptionCreationFailed) {
        subscriptionSection = `
            <div class="subscription-info warning">
                <h4>⚠️ Subscription Setup Issue</h4>
                <p>Your payment was successful, but there was an issue setting up your monthly subscription.</p>
                <p>We'll contact you within 24 hours to resolve this.</p>
                <p><strong>Error:</strong> ${window.subscriptionError || 'Unknown error'}</p>
            </div>
        `;
    } else {
        subscriptionSection = `
            <div class="subscription-info">
                <h4>🔄 Monthly Subscription</h4>
                <p>Your monthly subscription is being set up and will begin in 30 days.</p>
                <p>You'll receive a confirmation email with subscription details shortly.</p>
            </div>
        `;
    }
    
    // Replace modal content with success message
    modalBody.innerHTML = `
        <div class="payment-success">
            <div class="success-icon">✓</div>
            <h3>Payment Successful!</h3>
            <p>Thank you for your order! We'll contact you within 24 hours to schedule your first tote delivery.</p>
            <p>A receipt has been sent to your email address.</p>
            
            ${subscriptionSection}
            
            <div class="next-steps">
                <h4>📦 What happens next?</h4>
                <ol>
                    <li>We'll call you within 24 hours to schedule delivery</li>
                    <li>Your ${window.currentOrderData?.toteNumber || 'N/A'} totes will be delivered to your address</li>
                    <li>Monthly billing begins 30 days from today</li>
                    <li>You can manage your subscription anytime using the link above</li>
                </ol>
            </div>
            
            <div class="action-buttons">
                <button onclick="closePaymentModal()" class="btn btn-primary">Close</button>
                <button onclick="openManageSubscription()" class="btn btn-secondary">Manage Subscription</button>
            </div>
        </div>
    `;
}

/**
 * Initialize all modal event listeners
 * 
 * Sets up click handlers for modal close, payment submission,
 * and outside-click-to-close functionality.
 */
function initializeModalEventListeners() {
    // Close button (X) in modal header
    const closeBtn = document.querySelector('.payment-modal-close');
    if (closeBtn) {
        closeBtn.onclick = closePaymentModal;
    }
    
    // Payment submit button
    const submitBtn = document.getElementById('payment-submit');
    if (submitBtn) {
        submitBtn.onclick = handlePaymentSubmission; // Function from stripe-handlers.js
    }
    
    // Close modal when clicking outside the modal content
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.onclick = function(event) {
            // Only close if clicking the modal backdrop, not the content
            if (event.target === modal) {
                closePaymentModal();
            }
        };
    }
    
    console.log('✅ Modal event listeners initialized');
}

// Export functions to global scope for use by other modules
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.showPaymentSuccess = showPaymentSuccess;
window.showPaymentError = showPaymentError;
window.hidePaymentError = hidePaymentError;
window.initializeModalEventListeners = initializeModalEventListeners;