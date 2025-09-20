/**
 * SUBSCRIPTION MANAGEMENT MODULE
 * 
 * This module handles customer subscription management including
 * access to Stripe Customer Portal for existing customers.
 * 
 * Dependencies: None (standalone module)
 * 
 * @author Stripe Integration Team
 * @version 1.0.0 - Customer subscription self-service
 */

/**
 * Open subscription management for current customer
 * Called after successful payment or from success modal
 */
async function openManageSubscription() {
    console.log('🏪 Opening subscription management...');
    
    // Get customer email from current order data or prompt user
    let customerEmail = '';
    
    if (window.currentOrderData && window.currentOrderData.email) {
        customerEmail = window.currentOrderData.email;
        console.log('Using email from current order:', customerEmail);
    } else {
        // Prompt user for email if not available
        customerEmail = prompt('Please enter the email address associated with your account:');
        if (!customerEmail) {
            console.log('User cancelled email entry');
            return;
        }
    }
    
    try {
        await openCustomerPortal(customerEmail);
    } catch (error) {
        console.error('Failed to open customer portal:', error);
        alert('Unable to open subscription management. Please try again or contact support.');
    }
}

/**
 * Open Stripe Customer Portal for subscription management
 * @param {string} email - Customer email address
 */
async function openCustomerPortal(email) {
    console.log('🌐 Requesting customer portal access...');
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
    }
    
    try {
        // Show loading indicator
        const loadingMessage = 'Opening subscription management...';
        if (typeof showPaymentError === 'function') {
            showPaymentError(loadingMessage);
        }
        
        // Call Netlify function to create portal session
        const response = await fetch('/.netlify/functions/customer-portal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer_email: email
            })
        });
        
        // Hide loading indicator
        if (typeof hidePaymentError === 'function') {
            hidePaymentError();
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to access customer portal');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        console.log('✅ Portal session created, redirecting...');
        
        // Redirect to Stripe Customer Portal
        window.location.href = data.portal_url;
        
    } catch (error) {
        console.error('❌ Customer portal error:', error);
        
        // Show user-friendly error message
        let errorMessage = 'Unable to access subscription management.';
        
        if (error.message.includes('not found')) {
            errorMessage = 'No account found with that email address. Please check your email or contact support.';
        } else if (error.message.includes('valid email')) {
            errorMessage = 'Please enter a valid email address.';
        }
        
        if (typeof showPaymentError === 'function') {
            showPaymentError(errorMessage);
        } else {
            alert(errorMessage);
        }
        
        throw error;
    }
}

/**
 * Initialize subscription management interface for existing customers
 * Adds a "Manage Subscription" section to the page
 */
function initializeSubscriptionManagement() {
    console.log('🔧 Initializing subscription management interface...');
    
    // Look for a container to add the subscription management form
    const heroSection = document.querySelector('.hero');
    const contactSection = document.querySelector('.contact-section');
    
    let targetContainer = null;
    
    // Add to contact page if it exists, otherwise add to hero section
    if (contactSection) {
        targetContainer = contactSection;
    } else if (heroSection) {
        targetContainer = heroSection.parentNode; // Add after hero
    }
    
    if (!targetContainer) {
        console.log('No suitable container found for subscription management form');
        return;\n    }\n    \n    // Create subscription management section\n    const subscriptionSection = document.createElement('section');\n    subscriptionSection.className = 'subscription-management-section';\n    subscriptionSection.innerHTML = `\n        <div class=\"container\">\n            <div class=\"subscription-management-content\">\n                <h2>Manage Your Subscription</h2>\n                <p>Existing customers can manage their storage subscription, update payment methods, or cancel service.</p>\n                \n                <form id=\"manage-subscription-form\" class=\"subscription-form\">\n                    <div class=\"form-group\">\n                        <label for=\"customer-email\">Email Address:</label>\n                        <input \n                            type=\"email\" \n                            id=\"customer-email\" \n                            name=\"customer_email\" \n                            placeholder=\"Enter your email address\"\n                            required\n                        >\n                    </div>\n                    \n                    <button type=\"submit\" class=\"btn btn-primary\">\n                        Access My Account\n                    </button>\n                </form>\n                \n                <div class=\"subscription-help\">\n                    <h4>What you can do:</h4>\n                    <ul>\n                        <li>Update your payment method</li>\n                        <li>View billing history and invoices</li>\n                        <li>Pause or cancel your subscription</li>\n                        <li>Update your billing address</li>\n                    </ul>\n                    \n                    <p><strong>Need help?</strong> Contact us at <a href=\"mailto:support@instantclosettotestorage.com\">support@instantclosettotestorage.com</a></p>\n                </div>\n            </div>\n        </div>\n    `;\n    \n    // Add styles for the subscription management section\n    const styles = `\n        <style>\n        .subscription-management-section {\n            padding: 4rem 0;\n            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);\n            margin: 2rem 0;\n        }\n        \n        .subscription-management-content {\n            max-width: 600px;\n            margin: 0 auto;\n            text-align: center;\n        }\n        \n        .subscription-management-content h2 {\n            color: #2c3e50;\n            margin-bottom: 1rem;\n        }\n        \n        .subscription-form {\n            background: white;\n            padding: 2rem;\n            border-radius: 12px;\n            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n            margin: 2rem 0;\n        }\n        \n        .subscription-form .form-group {\n            margin-bottom: 1.5rem;\n            text-align: left;\n        }\n        \n        .subscription-form label {\n            display: block;\n            margin-bottom: 0.5rem;\n            font-weight: 600;\n            color: #2c3e50;\n        }\n        \n        .subscription-form input[type=\"email\"] {\n            width: 100%;\n            padding: 0.75rem;\n            border: 2px solid #ddd;\n            border-radius: 6px;\n            font-size: 1rem;\n            transition: border-color 0.3s ease;\n        }\n        \n        .subscription-form input[type=\"email\"]:focus {\n            outline: none;\n            border-color: #F8CF1F;\n        }\n        \n        .subscription-help {\n            background: white;\n            padding: 1.5rem;\n            border-radius: 8px;\n            text-align: left;\n            margin-top: 2rem;\n        }\n        \n        .subscription-help h4 {\n            color: #2c3e50;\n            margin-bottom: 1rem;\n        }\n        \n        .subscription-help ul {\n            list-style-type: none;\n            padding: 0;\n        }\n        \n        .subscription-help li {\n            padding: 0.25rem 0;\n            position: relative;\n            padding-left: 1.5rem;\n        }\n        \n        .subscription-help li:before {\n            content: \"✓\";\n            position: absolute;\n            left: 0;\n            color: #28a745;\n            font-weight: bold;\n        }\n        </style>\n    `;\n    \n    // Add styles to document head\n    document.head.insertAdjacentHTML('beforeend', styles);\n    \n    // Insert subscription section\n    if (contactSection) {\n        // Add after contact section\n        contactSection.parentNode.insertBefore(subscriptionSection, contactSection.nextSibling);\n    } else {\n        // Add after hero section\n        heroSection.parentNode.insertBefore(subscriptionSection, heroSection.nextSibling);\n    }\n    \n    // Add event listener for form submission\n    const form = document.getElementById('manage-subscription-form');\n    if (form) {\n        form.addEventListener('submit', async function(event) {\n            event.preventDefault();\n            \n            const emailInput = document.getElementById('customer-email');\n            const email = emailInput.value.trim();\n            \n            if (!email) {\n                alert('Please enter your email address');\n                return;\n            }\n            \n            try {\n                await openCustomerPortal(email);\n            } catch (error) {\n                // Error is already handled in openCustomerPortal\n                console.log('Portal access failed:', error.message);\n            }\n        });\n    }\n    \n    console.log('✅ Subscription management interface initialized');\n}\n\n// Initialize when DOM is ready\ndocument.addEventListener('DOMContentLoaded', function() {\n    // Small delay to ensure other modules are loaded\n    setTimeout(initializeSubscriptionManagement, 500);\n});\n\n// Export functions to global scope\nwindow.openManageSubscription = openManageSubscription;\nwindow.openCustomerPortal = openCustomerPortal;