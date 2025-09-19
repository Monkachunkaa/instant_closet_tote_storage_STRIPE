/**
 * NETLIFY SERVERLESS FUNCTION - CREATE PAYMENT INTENT
 * 
 * This function creates a Stripe payment intent on the server side.
 * It's called by the client-side JavaScript to securely initialize
 * payments without exposing the Stripe secret key.
 * 
 * Security Features:
 * - Input validation and sanitization
 * - Rate limiting (5 requests per minute per IP)
 * - Amount limits and business rules validation
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key from dashboard
 * 
 * @author Stripe Integration Team
 * @version 2.0.0 - Added security enhancements
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// In-memory rate limiting store (resets when function cold-starts)
// For production, consider using external store like Redis
const requestCounts = new Map();

/**
 * Rate limiting function - prevents abuse of payment endpoint
 * Allows 5 requests per minute per IP address
 * @param {string} clientIP - Client IP address
 * @throws {Error} If rate limit exceeded
 */
function checkRateLimit(clientIP) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 5; // Max 5 requests per window
    
    // Get existing requests for this IP
    const requests = requestCounts.get(clientIP) || [];
    
    // Filter to only recent requests within the time window
    const recentRequests = requests.filter(timestamp => (now - timestamp) < windowMs);
    
    // Check if rate limit exceeded
    if (recentRequests.length >= maxRequests) {
        console.warn(`⚠️ Rate limit exceeded for IP: ${clientIP}`);
        throw new Error('Too many requests. Please wait a minute before trying again.');
    }
    
    // Add current request timestamp
    recentRequests.push(now);
    requestCounts.set(clientIP, recentRequests);
    
    console.log(`📈 Request ${recentRequests.length}/${maxRequests} for IP: ${clientIP}`);
}

/**
 * Validate and sanitize order data
 * Ensures all required fields are present and valid
 * @param {Object} orderData - Raw order data from client
 * @returns {Object} Validated and sanitized order data
 * @throws {Error} If validation fails
 */
function validateOrderData(orderData) {
    if (!orderData || typeof orderData !== 'object') {
        throw new Error('Order data is required');
    }
    
    // Helper function to sanitize text input
    const sanitizeText = (text) => {
        if (typeof text !== 'string') return '';
        return text
            .trim()
            .slice(0, 200) // Limit length
            .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
            .replace(/\s+/g, ' '); // Normalize whitespace
    };
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!orderData.email || !emailRegex.test(orderData.email)) {
        throw new Error('Valid email address is required');
    }
    
    // Validate phone format (basic check)
    const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
    if (!orderData.phone || !phoneRegex.test(orderData.phone) || orderData.phone.length < 10) {
        throw new Error('Valid phone number is required');
    }
    
    // Validate name
    if (!orderData.name || orderData.name.trim().length < 2) {
        throw new Error('Customer name is required (minimum 2 characters)');
    }
    
    // Validate address
    if (!orderData.address || orderData.address.trim().length < 10) {
        throw new Error('Complete address is required (minimum 10 characters)');
    }
    
    // Validate tote quantity
    const toteNumber = parseInt(orderData.toteNumber);
    if (!toteNumber || toteNumber < 2 || toteNumber > 10) {
        throw new Error('Tote quantity must be between 2 and 10');
    }
    
    // Validate total cost (business rules)
    const expectedCost = 20 + (toteNumber * 10); // $20 trip fee + $10 per tote
    const providedCost = parseFloat(orderData.totalCost);
    
    if (!providedCost || Math.abs(providedCost - expectedCost) > 0.01) {
        console.error(`🚨 Cost mismatch: expected ${expectedCost}, got ${providedCost}`);
        throw new Error('Invalid order amount calculated');
    }
    
    // Return sanitized data
    return {
        name: sanitizeText(orderData.name),
        email: orderData.email.toLowerCase().trim(),
        phone: sanitizeText(orderData.phone),
        address: sanitizeText(orderData.address),
        toteNumber: toteNumber,
        totalCost: expectedCost // Use calculated cost, not client-provided
    };
}

/**
 * Validate payment amount
 * Ensures amount is within business rules and matches order data
 * @param {number} amount - Amount in cents
 * @param {Object} orderData - Validated order data
 * @throws {Error} If amount validation fails
 */
function validateAmount(amount, orderData) {
    // Check amount is a valid number
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('Invalid payment amount');
    }
    
    // Business rules: minimum $40 (2 totes), maximum $120 (10 totes + trip fee)
    const minAmount = 40 * 100; // $40 in cents
    const maxAmount = 120 * 100; // $120 in cents
    
    if (amount < minAmount || amount > maxAmount) {
        throw new Error(`Payment amount must be between ${minAmount/100} and ${maxAmount/100}`);
    }
    
    // Verify amount matches order data
    const expectedAmount = orderData.totalCost * 100; // Convert to cents
    if (amount !== expectedAmount) {
        console.error(`🚨 Amount mismatch: expected ${expectedAmount}, got ${amount}`);
        throw new Error('Payment amount does not match order total');
    }
    
    console.log(`✅ Amount validation passed: ${amount/100}`);
}

exports.handler = async (event, context) => {
    const startTime = Date.now();
    console.log('🚀 Payment intent creation requested');
    
    // Get client IP for rate limiting
    const clientIP = event.headers['x-forwarded-for'] || 
                    event.headers['x-real-ip'] || 
                    context.clientContext?.identity?.ip || 
                    'unknown';
    
    try {
        // Apply rate limiting
        checkRateLimit(clientIP);
        
        // Only allow POST requests
        if (event.httpMethod !== 'POST') {
            console.warn(`⚠️ Non-POST request rejected from ${clientIP}`);
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
        
        // Parse and validate request body
        let requestData;
        try {
            requestData = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error('❌ Invalid JSON in request body');
            throw new Error('Invalid request format');
        }
        
        const { amount, orderData } = requestData;
        
        // Validate required data
        if (!amount || !orderData) {
            console.error('❌ Missing required data');
            throw new Error('Missing amount or order data');
        }
        
        // Validate and sanitize order data
        console.log('🔍 Validating order data...');
        const validatedOrderData = validateOrderData(orderData);
        
        // Validate payment amount
        console.log('💰 Validating payment amount...');
        validateAmount(amount, validatedOrderData);
        
        console.log('🎯 Creating payment intent for validated order:', {
            customer: validatedOrderData.name,
            email: validatedOrderData.email,
            amount: amount,
            totes: validatedOrderData.toteNumber
        });
        
        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            description: `Instant Closet Tote Storage - Setup (${validatedOrderData.toteNumber} totes)`,
            metadata: {
                customer_name: validatedOrderData.name,
                customer_email: validatedOrderData.email,
                customer_phone: validatedOrderData.phone,
                customer_address: validatedOrderData.address,
                tote_quantity: validatedOrderData.toteNumber.toString(),
                total_cost: validatedOrderData.totalCost.toString(),
                client_ip: clientIP,
                created_via: 'website_form'
            }
        });
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ Payment intent created successfully: ${paymentIntent.id} (${processingTime}ms)`);
        
        // Return client secret to frontend
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id
            })
        };
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error processing payment intent (${processingTime}ms):`, error.message);
        
        // Determine appropriate status code
        let statusCode = 500;
        if (error.message.includes('Too many requests')) {
            statusCode = 429; // Rate limit exceeded
        } else if (error.message.includes('required') || 
                  error.message.includes('Invalid') || 
                  error.message.includes('must be')) {
            statusCode = 400; // Bad request
        }
        
        return {
            statusCode: statusCode,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: error.message,
                code: statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : 'VALIDATION_ERROR'
            })
        };
    }
};