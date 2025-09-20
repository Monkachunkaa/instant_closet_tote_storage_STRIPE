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
 * @version 1.0.0
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
                    if (maxScroll >= 25 && !milestones[25]) {\n                        milestones[25] = true;\n                        gtag('event', 'scroll_depth_25', {\n                            'event_category': 'User Engagement',\n                            'event_label': '25% Page Scroll'\n                        });\n                    }\n                    if (maxScroll >= 50 && !milestones[50]) {\n                        milestones[50] = true;\n                        gtag('event', 'scroll_depth_50', {\n                            'event_category': 'User Engagement',\n                            'event_label': '50% Page Scroll'\n                        });\n                    }\n                    if (maxScroll >= 75 && !milestones[75]) {\n                        milestones[75] = true;\n                        gtag('event', 'scroll_depth_75', {\n                            'event_category': 'User Engagement',\n                            'event_label': '75% Page Scroll'\n                        });\n                    }\n                    if (maxScroll >= 90 && !milestones[90]) {\n                        milestones[90] = true;\n                        gtag('event', 'scroll_depth_90', {\n                            'event_category': 'User Engagement',\n                            'event_label': '90% Page Scroll'\n                        });\n                    }\n                }, 1000);\n            }\n        });\n    },\n    \n    /**\n     * Track time spent on page for engagement analysis\n     * Sends data when user leaves the page\n     */\n    trackTimeOnPage: function() {\n        const startTime = new Date().getTime();\n        \n        // Track when user leaves page\n        window.addEventListener('beforeunload', function() {\n            const timeOnPage = Math.round((new Date().getTime() - startTime) / 1000);\n            \n            // Only track if user spent meaningful time (more than 10 seconds)\n            if (timeOnPage > 10) {\n                gtag('event', 'time_on_page', {\n                    'time_seconds': timeOnPage,\n                    'event_category': 'User Engagement',\n                    'event_label': 'Page Duration'\n                });\n            }\n        });\n    },\n    \n    /**\n     * Track email clicks for contact method analysis\n     * @param {string} emailAddress - Email address that was clicked\n     */\n    trackEmailClick: function(emailAddress) {\n        gtag('event', 'email_click', {\n            'email_address': emailAddress,\n            'event_category': 'Contact',\n            'event_label': 'Email Link Clicked'\n        });\n        \n        console.log('📊 Analytics: Email click tracked', emailAddress);\n    },\n    \n    /**\n     * Track form field interactions for UX analysis\n     * @param {string} fieldName - Name of the form field\n     * @param {string} action - Action taken ('focus', 'blur', 'error')\n     */\n    trackFormFieldInteraction: function(fieldName, action) {\n        gtag('event', 'form_field_interaction', {\n            'field_name': fieldName,\n            'interaction_type': action,\n            'event_category': 'Form UX',\n            'event_label': `Field ${action}: ${fieldName}`\n        });\n    }\n};\n\n/**\n * Initialize all automatic tracking when DOM is ready\n * Sets up event listeners for common interactions\n */\nfunction initializeAnalyticsTracking() {\n    // Initialize engagement tracking\n    AnalyticsTracker.trackScrollDepth();\n    AnalyticsTracker.trackTimeOnPage();\n    \n    // Track all phone number clicks\n    document.querySelectorAll('a[href^=\"tel:\"]').forEach(link => {\n        link.addEventListener('click', function() {\n            const phoneNumber = this.getAttribute('href').replace('tel:', '');\n            AnalyticsTracker.trackPhoneCall(phoneNumber);\n        });\n    });\n    \n    // Track all email clicks\n    document.querySelectorAll('a[href^=\"mailto:\"]').forEach(link => {\n        link.addEventListener('click', function() {\n            const emailAddress = this.getAttribute('href').replace('mailto:', '');\n            AnalyticsTracker.trackEmailClick(emailAddress);\n        });\n    });\n    \n    // Track FAQ interactions\n    document.querySelectorAll('.faq-question').forEach(button => {\n        button.addEventListener('click', function() {\n            const question = this.querySelector('span:first-child')?.textContent?.trim() || this.textContent.trim();\n            AnalyticsTracker.trackFAQInteraction(question);\n        });\n    });\n    \n    // Track CTA button clicks\n    document.querySelectorAll('.btn, .nav-cta').forEach(button => {\n        button.addEventListener('click', function() {\n            const section = this.closest('section');\n            const location = section ? \n                (section.id || section.className.split(' ')[0] || 'unknown') : \n                'navigation';\n            const text = this.textContent.trim();\n            AnalyticsTracker.trackCTAClick(location, text);\n        });\n    });\n    \n    // Track form field interactions for UX insights\n    document.querySelectorAll('input, textarea, select').forEach(field => {\n        field.addEventListener('focus', function() {\n            AnalyticsTracker.trackFormFieldInteraction(this.name || this.id, 'focus');\n        });\n        \n        field.addEventListener('blur', function() {\n            if (this.required && !this.value) {\n                AnalyticsTracker.trackFormFieldInteraction(this.name || this.id, 'abandoned');\n            }\n        });\n    });\n    \n    console.log('✅ Enhanced Analytics tracking initialized');\n}\n\n// Auto-initialize when DOM is ready\ndocument.addEventListener('DOMContentLoaded', initializeAnalyticsTracking);\n\n// Make tracker available globally for form submissions and payments\nwindow.AnalyticsTracker = AnalyticsTracker;