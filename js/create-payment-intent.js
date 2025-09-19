const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { amount, orderData } = JSON.parse(event.body);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      metadata: {
        customer_name: orderData.name,
        customer_email: orderData.email,
        customer_phone: orderData.phone,
        customer_address: orderData.address,
        tote_quantity: orderData.toteNumber.toString()
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({
        client_secret: paymentIntent.client_secret
      })
    };

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create payment intent' 
      })
    };
  }
};