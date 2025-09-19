/**
 * STRIPE PAYMENT HANDLERS
 * Handles payment processing, success/failure, and email notifications
 * Depends on: stripe-payment.js, stripe-modal.js
 */

/**
 * Handle payment form submission
 */
async function handlePaymentSubmission() {
    // Check if Stripe is available
    if (typeof stripe === 'undefined' || !stripe) {
        showPaymentError('Payment system not ready. Please try again.');
        return;
    }
    
    // Check if elements are available
    if (typeof window.currentElements === 'undefined' || !window.currentElements) {
        showPaymentError('Payment form not properly loaded. Please refresh and try again.');
        return;
    }
    
    // Check if order data is available
    if (typeof window.currentOrderData === 'undefined' || !window.currentOrderData) {
        showPaymentError('Order information not found. Please refresh and try again.');
        return;
    }
    
    const submitButton = document.getElementById('payment-submit');
    const spinner = document.getElementById('payment-spinner');
    const buttonText = document.getElementById('payment-button-text');
    
    if (!submitButton || !spinner || !buttonText) {
        showPaymentError('Payment form not properly loaded. Please refresh and try again.');
        return;
    }
    
    // Disable submit button and show loading
    submitButton.disabled = true;
    spinner.classList.remove('hidden');
    buttonText.textContent = 'Processing...';
    
    hidePaymentError();
    
    try {
        console.log('Processing payment for order:', window.currentOrderData);
        
        // First, validate the payment form
        const {error: submitError} = await window.currentElements.submit();
        
        if (submitError) {
            console.error('Form validation error:', submitError);
            showPaymentError(submitError.message);
            return;
        }
        
        console.log('Payment form validation passed');
        
        // Since we're in demo mode, simulate the payment process
        // In production, you would create a payment intent and confirm it
        console.warn('DEMO MODE: Simulating successful payment processing');
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create a simulated successful payment intent
        const simulatedPaymentIntent = {
            id: `pi_${Date.now()}_demo_success`,
            status: 'succeeded',
            amount: window.currentOrderData.totalCost * 100, // Convert to cents
            currency: 'usd',
            created: Math.floor(Date.now() / 1000),
            description: `Instant Closet Tote Storage - Setup (${window.currentOrderData.toteNumber} totes)`,
            metadata: {
                customer_name: window.currentOrderData.name,
                customer_email: window.currentOrderData.email,
                customer_phone: window.currentOrderData.phone,
                customer_address: window.currentOrderData.address,
                tote_quantity: window.currentOrderData.toteNumber.toString()
            }
        };
        
        console.log('Demo payment succeeded:', simulatedPaymentIntent);
        
        // Handle successful payment
        await handlePaymentSuccess(simulatedPaymentIntent);
        
    } catch (error) {
        console.error('Payment processing error:', error);
        showPaymentError('An unexpected error occurred during payment. Please try again.');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        spinner.classList.add('hidden');
        buttonText.textContent = 'Complete Payment';
    }
}

/**
 * Handle successful payment
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentSuccess(paymentIntent) {
    try {
        // Send confirmation email to customer
        await sendCustomerReceipt(paymentIntent);
        
        // Send order details to business via EmailJS
        await sendBusinessNotification();
        
        // Show success message
        showPaymentSuccess();
        
    } catch (error) {
        console.error('Error handling payment success:', error);
        // Even if email fails, payment succeeded, so show success
        showPaymentSuccess();
    }
}

/**
 * Send receipt to customer
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function sendCustomerReceipt(paymentIntent) {
    if (typeof currentOrderData === 'undefined' || !currentOrderData) {
        console.error('No order data available for receipt');
        return;
    }
    
    const receiptData = {
        to_email: currentOrderData.email,
        customer_name: currentOrderData.name,
        order_id: paymentIntent.id,
        amount_paid: (paymentIntent.amount / 100).toFixed(2),
        tote_quantity: currentOrderData.toteNumber,
        setup_cost: currentOrderData.totalCost,
        customer_address: currentOrderData.address,
        customer_phone: currentOrderData.phone,
        payment_date: new Date().toLocaleDateString()
    };
    
    try {
        // You'll need to create a receipt template in EmailJS
        // Template ID should be something like 'customer_receipt'
        await emailjs.send('honeybee_gmail_service', 'customer_receipt', receiptData);
        console.log('Customer receipt sent successfully');
    } catch (error) {
        console.error('Failed to send customer receipt:', error);
        // Don't throw error - payment was successful
    }
}

/**
 * Send business notification via EmailJS
 */
async function sendBusinessNotification() {
    if (typeof currentOrderData === 'undefined' || !currentOrderData) {
        console.error('No order data available for business notification');
        return;
    }
    
    const businessData = {
        name: currentOrderData.name,
        email: currentOrderData.email,
        phone: currentOrderData.phone,
        address: currentOrderData.address,
        tote_number: currentOrderData.toteNumber,
        order_cost: currentOrderData.totalCost,
        message: 'PAID ORDER - Payment completed successfully',
        payment_status: 'COMPLETED',
        order_date: new Date().toLocaleDateString()
    };
    
    try {
        // Use existing business template
        await emailjs.send('honeybee_gmail_service', 'ICTS_lead', businessData);
        console.log('Business notification sent successfully');
    } catch (error) {
        console.error('Failed to send business notification:', error);
        // Don't throw error - payment was successful
    }
}

// Export functions for global access
window.handlePaymentSubmission = handlePaymentSubmission;
window.handlePaymentSuccess = handlePaymentSuccess;