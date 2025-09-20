/**
 * NETLIFY SERVERLESS FUNCTION - CREATE SUBSCRIPTION
 * 
 * This function creates a monthly subscription after successful initial payment.
 * Called by the frontend after payment intent succeeds.
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key from dashboard
 * 
 * @author Stripe Integration Team
 * @version 1.0.0 - Subscription creation for monthly billing
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Calculate the next billing date (30 days from now)
 * @returns {number} Unix timestamp for next billing date
 */
function getNextBillingDate() {
    const now = new Date();
    const nextBilling = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
    return Math.floor(nextBilling.getTime() / 1000);
}

/**
 * Create or find Stripe price for monthly billing
 * @param {number} monthlyAmount - Monthly amount in dollars
 * @returns {Object} Stripe price object
 */
async function createOrFindPrice(monthlyAmount) {
    const priceAmountCents = monthlyAmount * 100;
    const priceId = `monthly_storage_${monthlyAmount}_usd`;
    
    try {
        // Try to retrieve existing price
        const existingPrice = await stripe.prices.retrieve(priceId);
        console.log(`✅ Found existing price: ${existingPrice.id}`);
        return existingPrice;
    } catch (error) {
        // Price doesn't exist, create it
        console.log(`📦 Creating new price for $${monthlyAmount}/month...`);
        
        const price = await stripe.prices.create({
            id: priceId,
            currency: 'usd',
            unit_amount: priceAmountCents,
            recurring: {
                interval: 'month',
                interval_count: 1
            },
            product_data: {
                name: 'Monthly Tote Storage',
                description: `Monthly storage service ($20 base + $10 per tote)`
            },
            metadata: {
                service_type: 'monthly_storage',
                base_fee: '20',
                per_tote_fee: '10'
            }
        });
        
        console.log(`✅ Created new price: ${price.id}`);
        return price;
    }
}

exports.handler = async (event, context) => {
    const startTime = Date.now();
    console.log('🔄 Subscription creation requested');
    
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
        
        const { payment_intent_id, customer_id, monthly_amount, tote_quantity } = requestData;
        
        // Validate required data
        if (!payment_intent_id || !customer_id || !monthly_amount) {
            console.error('❌ Missing required subscription data');
            throw new Error('Missing payment intent ID, customer ID, or monthly amount');
        }
        
        // Validate monthly amount
        if (monthly_amount < 40 || monthly_amount > 120) {
            throw new Error('Invalid monthly amount');
        }
        
        console.log('🔍 Validating payment intent...');
        
        // Verify the payment intent succeeded and get payment method
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment intent has not succeeded yet');
        }
        
        if (!paymentIntent.payment_method) {
            throw new Error('No payment method found on payment intent');
        }
        
        console.log('💳 Setting up default payment method...');
        
        // Set the payment method as default for the customer
        await stripe.customers.update(customer_id, {
            invoice_settings: {
                default_payment_method: paymentIntent.payment_method
            }
        });
        
        console.log('💰 Creating subscription price...');
        
        // Create or find the price for this monthly amount
        const price = await createOrFindPrice(monthly_amount);
        
        console.log('🔄 Creating monthly subscription...');
        
        // Calculate trial end date (30 days from now)
        const trialEnd = getNextBillingDate();
        
        // Create the subscription with trial period
        const subscription = await stripe.subscriptions.create({
            customer: customer_id,
            items: [{
                price: price.id,
                quantity: 1
            }],
            trial_end: trialEnd,
            default_payment_method: paymentIntent.payment_method,
            collection_method: 'charge_automatically',
            billing_cycle_anchor: trialEnd,
            metadata: {
                original_payment_intent: payment_intent_id,
                tote_quantity: tote_quantity || 'unknown',
                setup_date: new Date().toISOString(),
                service_type: 'monthly_storage',
                created_via: 'website_initial_payment'
            },
            description: `Monthly Tote Storage Service - ${tote_quantity || 'N/A'} totes`
        });
        
        console.log('📅 Updating customer metadata...');
        
        // Update customer with subscription info
        await stripe.customers.update(customer_id, {
            metadata: {
                ...paymentIntent.metadata,
                subscription_id: subscription.id,
                subscription_status: subscription.status,
                next_billing_date: new Date(trialEnd * 1000).toISOString(),
                monthly_amount: monthly_amount.toString()
            }
        });
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ Subscription created successfully: ${subscription.id} (${processingTime}ms)`);
        console.log(`📅 Next billing date: ${new Date(trialEnd * 1000).toLocaleDateString()}`);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({
                subscription_id: subscription.id,
                status: subscription.status,
                next_billing_date: new Date(trialEnd * 1000).toISOString(),
                monthly_amount: monthly_amount,
                trial_end: new Date(trialEnd * 1000).toISOString()
            })
        };
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error creating subscription (${processingTime}ms):`, error.message);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: error.message,
                code: 'SUBSCRIPTION_CREATION_ERROR'
            })
        };
    }
};