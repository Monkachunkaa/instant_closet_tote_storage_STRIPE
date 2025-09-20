/**
 * STRIPE PAYMENT HANDLERS
 * 
 * This module handles real payment processing using Stripe payment intents,
 * subscription creation, success/failure states, and email notifications.
 * 
 * Dependencies: stripe-payment.js, stripe-modal.js, EmailJS
 * 
 * @author Stripe Integration Team
 * @version 3.0.0 - Added subscription creation after successful payment
 */

/**
 * Handle payment form submission and processing
 * 
 * Confirms the real Stripe payment intent and handles success/failure.
 * This replaces the previous demo simulation with actual payment processing.
 */
async function handlePaymentSubmission() {
    console.log('💳 Starting REAL payment submission process...');
    
    // Validate Stripe is available
    if (typeof stripe === 'undefined' || !stripe) {
        console.error('❌ Stripe not available');
        showPaymentError('Payment system not ready. Please try again.');
        return;
    }
    
    // Validate Stripe Elements are initialized
    if (typeof window.currentElements === 'undefined' || !window.currentElements) {
        console.error('❌ Stripe Elements not initialized');
        showPaymentError('Payment form not properly loaded. Please refresh and try again.');
        return;
    }
    
    // Validate client secret is available
    if (typeof window.currentClientSecret === 'undefined' || !window.currentClientSecret) {
        console.error('❌ Payment intent not created');
        showPaymentError('Payment intent not created. Please refresh and try again.');
        return;
    }
    
    // Validate order data is available
    if (typeof window.currentOrderData === 'undefined' || !window.currentOrderData) {
        console.error('❌ Order data not available');
        showPaymentError('Order information not found. Please refresh and try again.');
        return;
    }
    
    // Get UI elements for button state management
    const submitButton = document.getElementById('payment-submit');
    const spinner = document.getElementById('payment-spinner');
    const buttonText = document.getElementById('payment-button-text');
    
    if (!submitButton || !spinner || !buttonText) {
        console.error('❌ Payment form UI elements not found');
        showPaymentError('Payment form not properly loaded. Please refresh and try again.');
        return;
    }
    
    // Update UI to loading state
    submitButton.disabled = true;
    spinner.classList.remove('hidden');
    buttonText.textContent = 'Processing...';
    hidePaymentError();
    
    try {
        console.log('🚀 Confirming payment with Stripe...');
        
        // Confirm payment with real Stripe API
        const result = await stripe.confirmPayment({
            elements: window.currentElements,
            confirmParams: {
                return_url: window.location.href, // Return to same page after payment
            },
            redirect: 'if_required' // Only redirect if 3D Secure is needed
        });
        
        if (result.error) {
            // Payment failed - show error to user
            console.error('❌ Payment failed:', result.error);
            showPaymentError(result.error.message);
            
            // Log additional error details for debugging
            if (result.error.code) {
                console.error('Error code:', result.error.code);
            }
            if (result.error.decline_code) {
                console.error('Decline code:', result.error.decline_code);
            }
            
        } else if (result.paymentIntent) {
            // Payment succeeded!
            console.log('✅ REAL payment succeeded!', result.paymentIntent);
            
            // Create subscription for monthly billing
            try {
                await createSubscriptionAfterPayment(result.paymentIntent);
            } catch (subError) {
                console.error('⚠️ Subscription creation failed:', subError);
            }
            
            // Handle successful payment (emails, UI updates)
            await handlePaymentSuccess(result.paymentIntent);
            
        } else {
            // This shouldn't happen with 'if_required' redirect
            console.warn('⚠️ Unexpected result from Stripe:', result);
            showPaymentError('Payment status unclear. Please check your email for confirmation.');
        }
        
    } catch (error) {
        // Network or other unexpected error
        console.error('❌ Payment processing error:', error);
        showPaymentError('An unexpected error occurred during payment. Please try again.');
    } finally {
        // Always restore button state, regardless of success/failure
        submitButton.disabled = false;
        spinner.classList.add('hidden');
        buttonText.textContent = 'Complete Payment';
    }
}

/**
 * Create subscription after successful payment
 * 
 * Creates a monthly subscription for the customer using the saved payment method.
 * The subscription starts 30 days after the initial payment.
 * 
 * @param {Object} paymentIntent - Successful Stripe payment intent object
 */
async function createSubscriptionAfterPayment(paymentIntent) {
    console.log('🔄 Creating subscription after successful payment...');
    
    try {
        // Get subscription data from stored order information
        if (!window.currentOrderData) {
            console.error('❌ No order data available for subscription creation');
            throw new Error('Order data not found');
        }
        
        // Calculate monthly amount (same as initial payment formula minus setup fee)
        const monthlyAmount = window.currentOrderData.toteNumber * 10; // Only $10 per tote, no $20 setup fee
        
        console.log('📡 Calling subscription creation function...');
        
        // Call Netlify function to create subscription
        const response = await fetch('/.netlify/functions/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payment_intent_id: paymentIntent.id,
                customer_id: window.currentCustomerId, // Use stored customer ID
                monthly_amount: monthlyAmount,
                tote_quantity: window.currentOrderData.toteNumber
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('📡 Subscription creation failed:', errorText);
            throw new Error(`Subscription creation failed: ${response.status}`);
        }
        
        const subscriptionData = await response.json();
        
        if (subscriptionData.error) {
            throw new Error(subscriptionData.error);
        }
        
        console.log('✅ Subscription created successfully:', subscriptionData);
        
        // Store subscription info for email notifications
        window.currentSubscriptionData = subscriptionData;
        
        // Track subscription creation in analytics
        if (window.AnalyticsTracker) {
            window.AnalyticsTracker.trackSubscriptionCreated({
                subscription_id: subscriptionData.subscription_id,
                monthly_amount: subscriptionData.monthly_amount,
                next_billing_date: subscriptionData.next_billing_date
            });
        }
        
    } catch (error) {
        console.error('⚠️ Subscription creation failed:', error);
        // Don't throw - payment was successful, subscription failure shouldn't break the flow
        // We'll handle this gracefully in the success message
        window.subscriptionCreationFailed = true;
        window.subscriptionError = error.message;
    }
}

/**
 * Handle successful payment completion
 * 
 * Coordinates post-payment actions including sending email notifications
 * to both customer and business, then displays success confirmation.
 * 
 * @param {Object} paymentIntent - Real Stripe payment intent object
 * @param {string} paymentIntent.id - Unique payment identifier
 * @param {number} paymentIntent.amount - Amount in cents
 * @param {string} paymentIntent.status - Payment status ('succeeded')
 */
async function handlePaymentSuccess(paymentIntent) {
    console.log('🎉 Processing successful REAL payment...');
    
    // Track successful payment in analytics
    if (window.AnalyticsTracker && window.currentOrderData) {
        window.AnalyticsTracker.trackPaymentSuccess(window.currentOrderData, paymentIntent.id);
    }
    
    try {
        // Send email notifications in parallel for better performance
        const emailPromises = [
            sendCustomerReceipt(paymentIntent),
            sendBusinessNotification(paymentIntent)
        ];
        
        // Wait for both emails to complete (or fail)
        const emailResults = await Promise.allSettled(emailPromises);
        
        // Log email results
        emailResults.forEach((result, index) => {
            const emailType = index === 0 ? 'customer receipt' : 'business notification';
            if (result.status === 'fulfilled') {
                console.log(`✅ ${emailType} sent successfully`);
            } else {
                console.warn(`⚠️ ${emailType} failed:`, result.reason);
            }
        });
        
        // Show success message regardless of email status
        // Payment succeeded, so user should see success even if emails fail
        showPaymentSuccess();
        
        console.log('✅ Payment success handling completed');
        
    } catch (error) {
        console.error('⚠️ Error in payment success handling:', error);
        // Still show success since payment went through
        showPaymentSuccess();
    }
}

/**
 * Send receipt email to customer
 * 
 * Uses EmailJS to send a formatted receipt to the customer with
 * order details, payment confirmation, and subscription information.
 * 
 * @param {Object} paymentIntent - Real Stripe payment intent object
 */
async function sendCustomerReceipt(paymentIntent) {
    if (!window.currentOrderData) {
        console.error('❌ No order data available for customer receipt');
        return;
    }
    
    console.log('📧 Sending customer receipt for real payment...');
    
    // Format next billing date
    let nextBillingInfo = 'Your monthly billing will begin in 30 days.';
    let subscriptionStatus = 'Monthly subscription will be set up automatically.';
    
    if (window.currentSubscriptionData) {
        const nextBillingDate = new Date(window.currentSubscriptionData.next_billing_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        nextBillingInfo = `Your next billing date is ${nextBillingDate} for ${window.currentSubscriptionData.monthly_amount}.`;
        subscriptionStatus = `Monthly subscription active (ID: ${window.currentSubscriptionData.subscription_id}).`;
    } else if (window.subscriptionCreationFailed) {
        subscriptionStatus = 'Monthly subscription setup encountered an issue. We will contact you to resolve this.';
        nextBillingInfo = 'Please check your email for follow-up instructions.';
    }
    
    const receiptData = {
        to_email: window.currentOrderData.email,
        customer_name: window.currentOrderData.name,
        order_id: paymentIntent.id, // Real Stripe payment intent ID
        amount_paid: (paymentIntent.amount / 100).toFixed(2), // Convert cents to dollars
        tote_quantity: window.currentOrderData.toteNumber,
        setup_cost: window.currentOrderData.totalCost,
        monthly_cost: (window.currentOrderData.toteNumber * 10).toFixed(2), // Monthly cost without setup fee
        customer_address: window.currentOrderData.address,
        customer_phone: window.currentOrderData.phone,
        payment_date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        payment_status: paymentIntent.status.toUpperCase(), // 'SUCCEEDED'
        subscription_status: subscriptionStatus,
        next_billing_info: nextBillingInfo,
        subscription_id: window.currentSubscriptionData?.subscription_id || 'Pending setup'
    };
    
    try {
        // Use updated customer receipt template (ICTS_customer_receipt)
        await emailjs.send('honeybee_gmail_service', 'ICTS_customer_receipt', receiptData);
        console.log('✅ Customer receipt sent successfully for payment:', paymentIntent.id);
    } catch (error) {
        console.error('⚠️ Failed to send customer receipt:', error);
        // Don't throw - payment was successful regardless of email status
    }
}

/**
 * Send order notification to business
 * 
 * Uses EmailJS to notify the business of a new REAL paid order with
 * customer details, payment confirmation, and subscription information.
 * 
 * @param {Object} paymentIntent - Real Stripe payment intent object
 */
async function sendBusinessNotification(paymentIntent) {
    if (!window.currentOrderData) {
        console.error('❌ No order data available for business notification');
        return;
    }
    
    console.log('📧 Sending business notification for real payment...');
    
    // Format subscription info for business
    let subscriptionInfo = 'Monthly subscription setup pending';
    if (window.currentSubscriptionData) {
        subscriptionInfo = `Monthly subscription created: ${window.currentSubscriptionData.subscription_id} - Next billing: ${new Date(window.currentSubscriptionData.next_billing_date).toLocaleDateString()}`;
    } else if (window.subscriptionCreationFailed) {
        subscriptionInfo = `⚠️ SUBSCRIPTION SETUP FAILED: ${window.subscriptionError} - MANUAL SETUP REQUIRED`;
    }
    
    const businessData = {
        name: window.currentOrderData.name,
        email: window.currentOrderData.email,
        phone: window.currentOrderData.phone,
        address: window.currentOrderData.address,
        tote_number: window.currentOrderData.toteNumber,
        order_cost: window.currentOrderData.totalCost,
        monthly_cost: (window.currentOrderData.toteNumber * 10).toFixed(2), // Monthly cost without setup fee
        message: `REAL PAID ORDER WITH SUBSCRIPTION - Payment ID: ${paymentIntent.id}`,
        payment_status: 'COMPLETED - REAL PAYMENT',
        payment_id: paymentIntent.id, // Include real Stripe payment ID
        payment_amount: (paymentIntent.amount / 100).toFixed(2), // Real amount charged
        subscription_info: subscriptionInfo,
        subscription_id: window.currentSubscriptionData?.subscription_id || 'Setup pending',
        customer_id: paymentIntent.customer,
        order_date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    try {
        // Use new order template (ICTS_order) for business notification
        await emailjs.send('honeybee_gmail_service', 'ICTS_order', businessData);
        console.log('✅ Business notification sent successfully for payment:', paymentIntent.id);
    } catch (error) {
        console.error('⚠️ Failed to send business notification:', error);
        // Don't throw - payment was successful regardless of email status
    }
}

// Export functions to global scope for use by other modules
window.handlePaymentSubmission = handlePaymentSubmission;
window.handlePaymentSuccess = handlePaymentSuccess;