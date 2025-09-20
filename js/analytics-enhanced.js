/**
 * ENHANCED GOOGLE ANALYTICS TRACKING
 * Advanced tracking for Instant Closet Tote Storage business metrics
 * 
 * This module tracks key business events including:
 * - Form submissions (lead generation)
 * - Payment events (revenue tracking)
 * - User engagement (scroll depth, time on page)
 * - Phone calls and CTA interactions
 * 
 * @author Analytics Team
 * @version 1.1.0 - Fixed syntax errors and optimized tracking
 */

// Enhanced Analytics Tracking Functions
const AnalyticsTracker = {
    
    /**
     * Track form submissions for lead generation analysis
     * @param {string} formType - Type of form ('hero' or 'contact')
     * @param {Object} formData - Form data including tote quantity and location
     */
    trackFormSubmission: function(formType, formData) {
        gtag('event', 'form_submit', {
            'form_type': formType,
            'tote_quantity': formData.tote_number || null,
            'customer_location': formData.address || null,
            'event_category': 'Lead Generation',
            'event_label': formType === 'hero' ? 'Hero Form' : 'Contact Form'
        });
        
        console.log('📊 Analytics: Form submission tracked', formType);
    },
    
    /**
     * Track payment initiation for conversion funnel analysis
     * @param {Object} orderData - Order information including cost and tote quantity
     */
    trackPaymentStart: function(orderData) {
        gtag('event', 'begin_checkout', {
            'currency': 'USD',
            'value': orderData.totalCost,
            'items': [{
                'item_id': 'tote_storage_setup',
                'item_name': 'Tote Storage Setup',
                'category': 'Storage Service',
                'quantity': orderData.toteNumber,
                'price': 10.00
            }],
            'event_category': 'Ecommerce',
            'event_label': 'Payment Modal Opened'
        });
        
        console.log('📊 Analytics: Payment initiation tracked', orderData);
    },
    
    /**
     * Track successful payments for revenue analysis
     * @param {Object} orderData - Order information
     * @param {string} paymentIntentId - Stripe payment intent ID
     */
    trackPaymentSuccess: function(orderData, paymentIntentId) {
        gtag('event', 'purchase', {
            'transaction_id': paymentIntentId,
            'currency': 'USD',
            'value': orderData.totalCost,
            'items': [{
                'item_id': 'tote_storage_setup',
                'item_name': 'Tote Storage Setup',
                'category': 'Storage Service',
                'quantity': orderData.toteNumber,
                'price': 10.00
            }],
            'event_category': 'Ecommerce',
            'event_label': 'Payment Completed'
        });
        
        console.log('📊 Analytics: Purchase tracked', paymentIntentId);
    },
    
    /**
     * Track subscription creation for recurring revenue analysis
     * @param {Object} subscriptionData - Subscription information
     */
    trackSubscriptionCreated: function(subscriptionData) {
        gtag('event', 'subscription_created', {
            'subscription_id': subscriptionData.subscription_id,
            'monthly_amount': subscriptionData.monthly_amount,
            'next_billing_date': subscriptionData.next_billing_date,
            'event_category': 'Subscription',
            'event_label': 'Monthly Subscription Active'
        });
        
        console.log('📊 Analytics: Subscription creation tracked', subscriptionData);
    },
    
    /**
     * Track phone call attempts for contact analysis
     * @param {string} phoneNumber - Phone number that was clicked
     */
    trackPhoneCall: function(phoneNumber) {
        gtag('event', 'phone_call', {
            'phone_number': phoneNumber,
            'event_category': 'Contact',
            'event_label': 'Phone Call Initiated'
        });
        
        console.log('📊 Analytics: Phone call tracked', phoneNumber);
    },
    
    /**
     * Track FAQ interactions for self-service analysis
     * @param {string} question - FAQ question that was opened
     */
    trackFAQInteraction: function(question) {
        gtag('event', 'faq_interaction', {
            'faq_question': question.substring(0, 100), // Limit length for GA4
            'event_category': 'User Engagement',
            'event_label': 'FAQ Opened'
        });
        
        console.log('📊 Analytics: FAQ interaction tracked');
    },
    
    /**
     * Track CTA button clicks for engagement analysis
     * @param {string} ctaLocation - Section where CTA was clicked
     * @param {string} ctaText - Text of the CTA button
     */
    trackCTAClick: function(ctaLocation, ctaText) {
        gtag('event', 'cta_click', {
            'cta_location': ctaLocation,
            'cta_text': ctaText.substring(0, 50), // Limit length
            'event_category': 'User Engagement',
            'event_label': 'CTA Clicked'
        });
        
        console.log('📊 Analytics: CTA click tracked', ctaLocation);
    },
    
    /**
     * Track scroll depth for page engagement analysis
     * Tracks milestones at 25%, 50%, 75%, and 90% scroll depth
     */
    trackScrollDepth: function() {
        let maxScroll = 0;
        let timer = null;
        let milestones = {
            25: false,
            50: false,
            75: false,
            90: false
        };
        
        window.addEventListener('scroll', function() {
            const scrolled = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            
            if (scrolled > maxScroll) {
                maxScroll = scrolled;
                
                // Clear existing timer
                if (timer) clearTimeout(timer);
                
                // Set timer to fire after user stops scrolling
                timer = setTimeout(() => {
                    // Track each milestone only once
                    if (maxScroll >= 25 && !milestones[25]) {
                        milestones[25] = true;
                        gtag('event', 'scroll_depth_25', {
                            'event_category': 'User Engagement',
                            'event_label': '25% Page Scroll'
                        });
                    }
                    if (maxScroll >= 50 && !milestones[50]) {
                        milestones[50] = true;
                        gtag('event', 'scroll_depth_50', {
                            'event_category': 'User Engagement',
                            'event_label': '50% Page Scroll'
                        });
                    }
                    if (maxScroll >= 75 && !milestones[75]) {
                        milestones[75] = true;
                        gtag('event', 'scroll_depth_75', {
                            'event_category': 'User Engagement',
                            'event_label': '75% Page Scroll'
                        });
                    }
                    if (maxScroll >= 90 && !milestones[90]) {
                        milestones[90] = true;
                        gtag('event', 'scroll_depth_90', {
                            'event_category': 'User Engagement',
                            'event_label': '90% Page Scroll'
                        });
                    }
                }, 1000);
            }
        });
    },
    
    /**
     * Track time spent on page for engagement analysis
     * Sends data when user leaves the page
     */
    trackTimeOnPage: function() {
        const startTime = new Date().getTime();
        
        // Track when user leaves page
        window.addEventListener('beforeunload', function() {
            const timeOnPage = Math.round((new Date().getTime() - startTime) / 1000);
            
            // Only track if user spent meaningful time (more than 10 seconds)
            if (timeOnPage > 10) {
                gtag('event', 'time_on_page', {
                    'time_seconds': timeOnPage,
                    'event_category': 'User Engagement',
                    'event_label': 'Page Duration'
                });
            }
        });
    },
    
    /**
     * Track email clicks for contact method analysis
     * @param {string} emailAddress - Email address that was clicked
     */
    trackEmailClick: function(emailAddress) {
        gtag('event', 'email_click', {
            'email_address': emailAddress,
            'event_category': 'Contact',
            'event_label': 'Email Link Clicked'
        });
        
        console.log('📊 Analytics: Email click tracked', emailAddress);
    },
    
    /**
     * Track form field interactions for UX analysis
     * @param {string} fieldName - Name of the form field
     * @param {string} action - Action taken ('focus', 'blur', 'error')
     */
    trackFormFieldInteraction: function(fieldName, action) {
        gtag('event', 'form_field_interaction', {
            'field_name': fieldName,
            'interaction_type': action,
            'event_category': 'Form UX',
            'event_label': `Field ${action}: ${fieldName}`
        });
    }
};

/**
 * Initialize all automatic tracking when DOM is ready
 * Sets up event listeners for common interactions
 */
function initializeAnalyticsTracking() {
    // Initialize engagement tracking
    AnalyticsTracker.trackScrollDepth();
    AnalyticsTracker.trackTimeOnPage();
    
    // Track all phone number clicks
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', function() {
            const phoneNumber = this.getAttribute('href').replace('tel:', '');
            AnalyticsTracker.trackPhoneCall(phoneNumber);
        });
    });
    
    // Track all email clicks
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.addEventListener('click', function() {
            const emailAddress = this.getAttribute('href').replace('mailto:', '');
            AnalyticsTracker.trackEmailClick(emailAddress);
        });
    });
    
    // Track FAQ interactions
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', function() {
            const question = this.querySelector('span:first-child')?.textContent?.trim() || this.textContent.trim();
            AnalyticsTracker.trackFAQInteraction(question);
        });
    });
    
    // Track CTA button clicks
    document.querySelectorAll('.btn, .nav-cta').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.closest('section');
            const location = section ? 
                (section.id || section.className.split(' ')[0] || 'unknown') : 
                'navigation';
            const text = this.textContent.trim();
            AnalyticsTracker.trackCTAClick(location, text);
        });
    });
    
    // Track form field interactions for UX insights
    document.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('focus', function() {
            AnalyticsTracker.trackFormFieldInteraction(this.name || this.id, 'focus');
        });
        
        field.addEventListener('blur', function() {
            if (this.required && !this.value) {
                AnalyticsTracker.trackFormFieldInteraction(this.name || this.id, 'abandoned');
            }
        });
    });
    
    console.log('✅ Enhanced Analytics tracking initialized');
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAnalyticsTracking);

// Make tracker available globally for form submissions and payments
window.AnalyticsTracker = AnalyticsTracker;