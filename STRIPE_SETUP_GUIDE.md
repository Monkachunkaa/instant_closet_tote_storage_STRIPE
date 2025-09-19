# Stripe Payment Integration Setup Guide

## Overview
This implementation provides a complete client-side Stripe payment integration for Instant Closet Tote Storage. When users click "Submit Order", they see a payment modal with Stripe Elements, and upon successful payment, both customer receipts and business notifications are sent via EmailJS.

## What's Changed

### 1. Button Text
- Changed from "Get Started Today" to "Submit Order"

### 2. Form Flow
- Hero form now triggers payment modal instead of direct EmailJS submission
- Contact form still uses original EmailJS flow (no payment required)

### 3. New Files Created
- `js/stripe-payment.js` - Main Stripe integration and initialization
- `js/stripe-modal.js` - Payment modal management and display
- `js/stripe-handlers.js` - Payment processing and email notifications

### 4. Updated Files
- `index.html` - Added Stripe SDK, payment modal HTML, and new script includes
- `css/components.css` - Added comprehensive payment modal styling
- `js/forms.js` - Modified to route hero form to Stripe payment flow

## Setup Instructions

### 1. Get Your Stripe Keys
1. Create a Stripe account at https://stripe.com
2. Go to Developers > API Keys
3. Copy your **Publishable Key** (starts with `pk_test_` for test mode)

### 2. Update Stripe Configuration
In `js/stripe-payment.js`, replace the placeholder:
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
```
With your actual publishable key:
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51ABC123...'; // Your actual key
```

### 3. Create EmailJS Receipt Template
1. Go to your EmailJS dashboard
2. Create a new email template with ID: `customer_receipt`
3. Use these template variables:
   - `{{to_email}}` - Customer email
   - `{{customer_name}}` - Customer name
   - `{{order_id}}` - Payment intent ID
   - `{{amount_paid}}` - Total amount paid
   - `{{tote_quantity}}` - Number of totes
   - `{{setup_cost}}` - Setup cost
   - `{{customer_address}}` - Customer address
   - `{{customer_phone}}` - Customer phone
   - `{{payment_date}}` - Payment date

### 4. Server-Side Setup (Production)
For production, you'll need to implement server-side payment intent creation:

#### Create a server endpoint (e.g., `/create-payment-intent`)
```javascript
// Example Node.js endpoint
app.post('/create-payment-intent', async (req, res) => {
  const { amount, orderData } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount, // amount in cents
    currency: 'usd',
    metadata: {
      customer_name: orderData.name,
      customer_email: orderData.email,
      tote_quantity: orderData.toteNumber
    }
  });
  
  res.send({
    client_secret: paymentIntent.client_secret
  });
});
```

#### Update the `createPaymentIntent` function in `stripe-payment.js`:
```javascript
async function createPaymentIntent(amount, orderData) {
    const response = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: amount,
            orderData: orderData
        })
    });
    
    const { client_secret } = await response.json();
    return client_secret;
}
```

#### Update the payment confirmation in `stripe-handlers.js`:
```javascript
// Replace the demo simulation with actual Stripe confirmation
const result = await stripe.confirmPayment({
    elements,
    confirmParams: {
        return_url: window.location.origin + '/payment-success',
    },
    redirect: 'if_required'
});
```

## Testing

### Test Mode
- The current setup runs in demo mode for testing
- No real payments are processed
- All payment confirmations are simulated
- EmailJS notifications will still be sent

### Test Cards (when connected to real Stripe)
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

## File Structure

```
js/
├── stripe-payment.js     # Main Stripe integration
├── stripe-modal.js       # Modal management
├── stripe-handlers.js    # Payment processing
├── forms.js              # Updated form handling
├── pricing.js            # Pricing calculations (unchanged)
└── ...

css/
└── components.css        # Updated with modal styles

index.html                # Updated with modal HTML and scripts
```

## Features

### Payment Modal
- Professional, responsive design
- Order summary with customer details
- Real-time pricing calculation
- Stripe Elements integration
- Loading states and error handling
- Success confirmation

### Email Notifications
- **Customer Receipt**: Sent automatically after successful payment
- **Business Notification**: Includes "PAID ORDER" status for easy identification
- **Error Handling**: Payment success isn't dependent on email delivery

### Security
- No sensitive payment data stored client-side
- Stripe handles all payment processing securely
- Server-side payment intent creation (in production)

## Customization

### Styling
The payment modal styling can be customized in `css/components.css` under the "PAYMENT MODAL STYLES" section.

### Stripe Elements Theme
Customize the payment form appearance in `stripe-payment.js`:
```javascript
appearance: {
    theme: 'stripe',
    variables: {
        colorPrimary: '#F8CF1F',     // Your brand color
        colorBackground: '#ffffff',
        colorText: '#30313d',
        // ... more customization options
    }
}
```

### Email Templates
Customize the email templates in your EmailJS dashboard to match your branding.

## Troubleshooting

### Common Issues
1. **"Stripe not initialized"** - Check that your publishable key is correct
2. **Modal not showing** - Verify all HTML elements have correct IDs
3. **Payment not processing** - Check browser console for errors
4. **Emails not sending** - Verify EmailJS service and template IDs

### Debug Mode
Open browser console to see detailed logging of the payment process.

## Production Checklist

- [ ] Replace test Stripe key with live key
- [ ] Implement server-side payment intent creation
- [ ] Update payment confirmation to use real Stripe API
- [ ] Test with real payment methods
- [ ] Set up webhook handling for payment events
- [ ] Configure proper error logging
- [ ] Test email delivery in production

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements Guide](https://stripe.com/docs/stripe-js)
- [Payment Intents API](https://stripe.com/docs/api/payment_intents)