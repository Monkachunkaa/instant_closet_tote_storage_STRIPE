/**
 * STRIPE PAYMENT MODAL
 * Handles payment modal display, order summary, and modal interactions
 * Depends on: stripe-payment.js
 */

/**
 * Show payment error message
 * @param {string} message - Error message to display
 */
function showPaymentError(message) {
    const errorElement = document.getElementById('payment-errors');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

/**
 * Hide payment error message
 */
function hidePaymentError() {
    const errorElement = document.getElementById('payment-errors');
    if (errorElement) {
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }
}

/**
 * Show the payment modal with order details
 * @param {Object} orderData - Order information from the form
 */
async function showPaymentModal(orderData) {
    const modal = document.getElementById('payment-modal');
    const orderDetails = document.getElementById('order-details');
    const totalAmount = document.getElementById('total-amount');
    
    if (!modal || !orderDetails || !totalAmount) {
        console.error('Payment modal elements not found');
        return;
    }
    
    // Calculate total cost
    const cost = orderData.totalCost;
    
    // Update order summary
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
            <span class="order-detail-value">${cost} ($20 trip fee + ${orderData.toteNumber * 10} first month)</span>
        </div>
    `;
    
    totalAmount.textContent = `${cost}`;
    
    // Show modal with animation
    modal.style.display = 'flex';
    
    // Initialize Stripe Elements for this payment
    await initializePaymentForm(orderData);
}

/**
 * Initialize payment form with proper Stripe Elements
 * @param {Object} orderData - Order information
 */
async function initializePaymentForm(orderData) {
    if (typeof stripe === 'undefined' || !stripe) {
        console.error('Stripe not initialized');
        showPaymentError('Payment system not loaded. Please refresh and try again.');
        return;
    }
    
    const paymentElementContainer = document.getElementById('payment-element');
    if (!paymentElementContainer) {
        console.error('Payment element container not found');
        showPaymentError('Payment form container not found. Please refresh and try again.');
        return;
    }
    
    try {
        console.log('Initializing payment form for order:', orderData);
        
        // Clear any existing content
        paymentElementContainer.innerHTML = '';
        
        // For demo purposes, let's use a simpler approach that works client-side
        // We'll create elements in setup mode which doesn't require a payment intent
        const elements = stripe.elements({
            mode: 'setup',
            currency: 'usd',
            setup_future_usage: 'off_session',
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
        
        // Create and mount payment element
        const paymentElement = elements.create('payment');
        
        console.log('Mounting payment element...');
        paymentElement.mount('#payment-element');
        
        // Store elements globally for payment processing
        window.currentElements = elements;
        window.currentPaymentElement = paymentElement;
        window.currentOrderData = orderData; // Store order data globally
        
        // Handle payment element events
        paymentElement.on('ready', () => {
            console.log('Payment element ready and mounted successfully');
        });
        
        paymentElement.on('change', (event) => {
            if (event.error) {
                console.error('Payment element error:', event.error);
                showPaymentError(event.error.message);
            } else {
                hidePaymentError();
            }
        });
        
        console.log('Payment form initialization completed');
        
    } catch (error) {
        console.error('Error initializing payment form:', error);
        showPaymentError('Failed to load payment form. Please try again.');
        
        // Fallback: show a message in the payment element container
        paymentElementContainer.innerHTML = `
            <div style="padding: 1rem; text-align: center; color: #666;">
                <p>Payment form failed to load. Please refresh the page and try again.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Error: ${error.message}</p>
            </div>
        `;
    }
}

/**
 * Close the payment modal
 */
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset global order data
    if (typeof currentOrderData !== 'undefined') {
        currentOrderData = null;
    }
    
    // Clean up Stripe elements
    if (typeof paymentElement !== 'undefined' && paymentElement) {
        paymentElement.destroy();
        paymentElement = null;
    }
    if (typeof elements !== 'undefined' && elements) {
        elements = null;
    }
    
    // Reset modal content for next use
    resetModalContent();
}

/**
 * Reset modal content to original state
 */
function resetModalContent() {
    const modalBody = document.querySelector('.payment-modal-body');
    
    if (!modalBody) return;
    
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
    
    // Re-attach event listeners
    initializeModalEventListeners();
}

/**
 * Show payment success message
 */
function showPaymentSuccess() {
    const modalBody = document.querySelector('.payment-modal-body');
    
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="payment-success">
            <div class="success-icon">✓</div>
            <h3>Payment Successful!</h3>
            <p>Thank you for your order! We'll contact you within 24 hours to schedule your first tote delivery.</p>
            <p>A receipt has been sent to your email address.</p>
            <button onclick="closePaymentModal()" class="btn btn-primary">Close</button>
        </div>
    `;
}

/**
 * Initialize modal event listeners
 */
function initializeModalEventListeners() {
    // Close button
    const closeBtn = document.querySelector('.payment-modal-close');
    if (closeBtn) {
        closeBtn.onclick = closePaymentModal;
    }
    
    // Payment submit button
    const submitBtn = document.getElementById('payment-submit');
    if (submitBtn) {
        submitBtn.onclick = handlePaymentSubmission;
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.onclick = function(event) {
            if (event.target === modal) {
                closePaymentModal();
            }
        };
    }
}

// Export functions for global access
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.showPaymentSuccess = showPaymentSuccess;
window.showPaymentError = showPaymentError;
window.hidePaymentError = hidePaymentError;
window.initializeModalEventListeners = initializeModalEventListeners;