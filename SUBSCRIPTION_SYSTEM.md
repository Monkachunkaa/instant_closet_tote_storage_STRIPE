# Instant Closet Tote Storage - Subscription System

## Overview

This system now includes a complete subscription billing solution using Stripe. Customers pay an initial setup fee plus first month, then are automatically billed monthly going forward.

## Payment Flow

### 1. Initial Payment
- Customer enters tote quantity (2-10)
- Pricing: $20 setup fee + $10 per tote (first month)
- Example: 5 totes = $20 + $50 = $70 initial payment

### 2. Subscription Creation
- After successful payment, monthly subscription is automatically created
- Monthly billing: $20 base + $10 per tote
- First billing occurs 30 days after initial payment
- Uses the same payment method from initial payment

### 3. Customer Management
- Customers can manage subscriptions via Stripe Customer Portal
- Self-service cancellation, payment method updates, billing history
- Access via email lookup on the website

## File Structure

### Netlify Functions
- `create-payment-intent.js` - Creates payment intent and Stripe customer
- `create-subscription.js` - Creates monthly subscription after successful payment  
- `customer-portal.js` - Provides access to Stripe Customer Portal

### Frontend JavaScript
- `stripe-payment.js` - Main Stripe initialization
- `stripe-modal.js` - Payment modal with subscription details
- `stripe-handlers.js` - Payment processing and subscription creation
- `subscription-management.js` - Customer portal access and management UI

### Key Features
- ✅ Real payment processing with Stripe
- ✅ Automatic subscription creation
- ✅ Customer self-service portal
- ✅ Email notifications with subscription details
- ✅ Error handling and graceful fallbacks
- ✅ Business owner management via Stripe Dashboard

## Environment Variables

Required in Netlify:
```
STRIPE_SECRET_KEY=sk_test_...
```

## Stripe Dashboard Setup

### 1. Customer Portal Configuration
1. Go to Stripe Dashboard > Settings > Customer Portal
2. Enable the following features:
   - Payment method update
   - Subscription cancellation (at period end)
   - Subscription pause
   - Invoice history
3. Set business profile headline: "Manage your Instant Closet Tote Storage subscription"

### 2. Webhook Endpoints (Optional)
For advanced features, you can set up webhooks:
- `subscription.created`
- `subscription.updated` 
- `subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Customer Experience

### New Customers
1. Fill out order form with tote quantity
2. See total cost: $20 + ($10 × totes)
3. Complete payment via Stripe
4. Receive confirmation with subscription details
5. Get access to manage subscription

### Existing Customers
1. Visit website and scroll to "Manage Subscription" section
2. Enter email address
3. Access Stripe Customer Portal
4. Update payment methods, view invoices, cancel subscription

## Business Management

### Stripe Dashboard
- View all subscriptions: Dashboard > Subscriptions
- Customer management: Dashboard > Customers
- Revenue analytics: Dashboard > Analytics
- Handle disputes: Dashboard > Disputes

### Key Metrics Available
- Monthly Recurring Revenue (MRR)
- Customer lifetime value
- Churn rate
- Failed payment recovery

### Managing Subscriptions
- Pause/resume subscriptions
- Update pricing (add/remove totes)
- Process refunds
- Handle customer inquiries

## Error Handling

### Payment Failures
- User sees clear error message
- Payment can be retried immediately
- No subscription created if payment fails

### Subscription Creation Failures
- Payment still succeeds (customer charged)
- Error logged and business notified
- Customer receives notice that subscription setup needs manual intervention
- Business can manually create subscription in Stripe Dashboard

### Customer Portal Issues
- Clear error messages for invalid emails
- Fallback to customer service contact
- Graceful handling of network issues

## Testing

### Test Cards (Stripe Test Mode)
- Success: `4242424242424242`
- Decline: `4000000000000002`
- 3D Secure: `4000002500003155`

### Test Scenarios
1. Successful payment and subscription creation
2. Payment success but subscription creation fails
3. Customer portal access with valid/invalid emails
4. Subscription management features

## Monitoring

### Key Things to Monitor
- Payment success rates
- Subscription creation success rates
- Customer portal usage
- Monthly recurring revenue growth
- Customer churn rates

### Alerts to Set Up
- Failed subscription creations
- High payment failure rates
- Customer portal errors
- Unusual cancellation spikes

## Support

### Customer Support Scenarios
1. **Payment went through but no subscription**: Check Stripe Dashboard, manually create subscription
2. **Can't access customer portal**: Verify email, check customer exists in Stripe
3. **Want to change tote quantity**: Update subscription in Stripe Dashboard or guide customer through portal
4. **Billing issues**: Handle via Stripe Dashboard billing section

### Business Owner Quick Actions
- **View customer**: Dashboard > Customers > Search by email
- **Update subscription**: Find customer > Subscriptions > Update
- **Issue refund**: Find payment > Refund
- **Cancel subscription**: Find subscription > Cancel

This system provides a complete, professional subscription billing solution that scales with your business while giving customers full self-service capabilities.