/**
 * NETLIFY SERVERLESS FUNCTION - CUSTOMER PORTAL
 * 
 * This function creates a Stripe customer portal session for subscription management.
 * Customers can update payment methods, cancel subscriptions, and view billing history.
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key from dashboard
 * 
 * @author Stripe Integration Team
 * @version 1.0.0 - Customer self-service portal
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Find customer by email address
 * @param {string} email - Customer email address
 * @returns {Object|null} Stripe customer object or null if not found
 */
async function findCustomerByEmail(email) {
    const customers = await stripe.customers.list({
        email: email.toLowerCase().trim(),
        limit: 1
    });
    
    return customers.data.length > 0 ? customers.data[0] : null;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

exports.handler = async (event, context) => {
    const startTime = Date.now();
    console.log('🏪 Customer portal session requested');
    
    try {
        // Only allow POST requests
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }
        
        // Handle preflight requests for CORS
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                }
            };
        }
        
        // Parse request body
        let requestData;
        try {
            requestData = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error('❌ Invalid JSON in request body');
            throw new Error('Invalid request format');
        }
        
        const { customer_email } = requestData;
        
        // Validate required data
        if (!customer_email) {
            throw new Error('Customer email is required');
        }
        
        // Validate email format
        if (!isValidEmail(customer_email)) {
            throw new Error('Please enter a valid email address');
        }
        
        console.log('🔍 Looking for customer with email:', customer_email);
        
        // Find customer by email
        const customer = await findCustomerByEmail(customer_email);
        
        if (!customer) {
            console.warn(`⚠️ Customer not found: ${customer_email}`);
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'No account found with that email address. Please check your email or contact support.',
                    code: 'CUSTOMER_NOT_FOUND'
                })
            };
        }
        
        console.log(`✅ Found customer: ${customer.id}`);
        
        // Get the current site URL for return path
        const siteUrl = process.env.URL || 'https://instantclosettotestorage.netlify.app';
        
        console.log('🏪 Creating customer portal session...');
        
        // Create customer portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: `${siteUrl}?portal=success`,
            configuration: {
                // You can customize what features are available in the portal
                business_profile: {
                    headline: 'Manage your Instant Closet Tote Storage subscription'
                },
                features: {
                    payment_method_update: {
                        enabled: true
                    },
                    subscription_cancel: {
                        enabled: true,
                        mode: 'at_period_end', // Cancel at end of billing period
                        cancellation_reason: {
                            enabled: true,
                            options: [
                                'too_expensive',
                                'missing_features', 
                                'switched_service',
                                'unused',
                                'other'
                            ]
                        }
                    },
                    subscription_pause: {
                        enabled: true
                    },
                    invoice_history: {
                        enabled: true
                    }
                }
            }
        });
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ Portal session created: ${portalSession.id} (${processingTime}ms)`);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({
                portal_url: portalSession.url,
                customer_id: customer.id,
                customer_name: customer.name
            })
        };
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error creating portal session (${processingTime}ms):`, error.message);
        
        // Determine appropriate status code
        let statusCode = 500;
        if (error.message.includes('email') || error.message.includes('valid')) {
            statusCode = 400; // Bad request
        }
        
        return {
            statusCode: statusCode,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: error.message,
                code: 'PORTAL_ERROR'
            })
        };
    }
};