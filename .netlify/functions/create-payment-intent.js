/**
 * NETLIFY SERVERLESS FUNCTION - CREATE PAYMENT INTENT
 * 
 * This function creates a Stripe payment intent on the server side.
 * It's called by the client-side JavaScript to securely initialize
 * payments without exposing the Stripe secret key.
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key from dashboard
 * 
 * @author Stripe Integration Team
 * @version 1.0.0
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  console.log('🚀 Payment intent creation requested');

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.warn('⚠️ Non-POST request rejected');
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

  try {
    // Parse request body
    const { amount, orderData } = JSON.parse(event.body);
    
    console.log('💰 Creating payment intent for amount:', amount);
    console.log('📦 Order data:', orderData);

    // Validate required data
    if (!amount || !orderData) {
      console.error('❌ Missing required data');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Missing amount or order data' 
        })
      };
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      description: `Instant Closet Tote Storage - Setup (${orderData.toteNumber} totes)`,
      metadata: {
        customer_name: orderData.name,
        customer_email: orderData.email,
        customer_phone: orderData.phone,
        customer_address: orderData.address,
        tote_quantity: orderData.toteNumber.toString(),
        total_cost: (amount / 100).toString()
      }
    });

    console.log('✅ Payment intent created successfully:', paymentIntent.id);

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
    console.error('❌ Error creating payment intent:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to create payment intent',
        details: error.message 
      })
    };
  }
};