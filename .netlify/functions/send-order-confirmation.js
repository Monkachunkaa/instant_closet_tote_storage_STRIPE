/**
 * AWS SES ORDER CONFIRMATION EMAIL HANDLER
 * Replaces EmailJS with AWS SES for order confirmation emails
 * Sends professional receipts to customers after successful payment
 * 
 * @version 1.0.0
 * @author Instant Closet Tote Storage Dev Team
 */

const AWS = require('aws-sdk');

// Configure AWS SES client
const ses = new AWS.SES({
  accessKeyId: process.env.ICTS_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.ICTS_AWS_SECRET_ACCESS_KEY,
  region: process.env.ICTS_AWS_REGION || 'us-east-1'
});

// CORS headers for browser compatibility
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Main handler function
 * Processes order confirmation requests and sends customer receipts via AWS SES
 */
exports.handler = async (event, context) => {
  console.log('🧾 SES Order Confirmation - Processing request...');
  console.log('🔍 AWS Region:', process.env.ICTS_AWS_REGION || 'us-east-1');
  console.log('🔍 Sender domain verification should be checked in AWS SES console');
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers, 
      body: '' 
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only POST requests are accepted'
      })
    };
  }

  try {
    // Parse and validate request body
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (parseError) {
      console.error('❌ Invalid JSON in request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON format',
          message: 'Request body must be valid JSON'
        })
      };
    }

    // Validate required fields for order confirmation
    const requiredFields = ['customer_name', 'to_email', 'order_id', 'amount_paid', 'tote_quantity', 'customer_address', 'customer_phone'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing required fields for order confirmation:', missingFields);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields', 
          missingFields,
          message: `Order confirmation requires: ${missingFields.join(', ')}`
        })
      };
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to_email)) {
      console.warn('⚠️ Invalid email format:', data.to_email);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid email address',
          message: 'Customer email address is not valid'
        })
      };
    }

    // Sanitize all inputs to prevent XSS and clean data
    const sanitize = (str) => {
      if (!str) return 'Not provided';
      return String(str)
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/[<>&"']/g, (char) => { // Escape special characters
          const escapeMap = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#x27;'
          };
          return escapeMap[char];
        })
        .trim();
    };

    const sanitizedData = {
      customer_name: sanitize(data.customer_name),
      to_email: sanitize(data.to_email),
      order_id: sanitize(data.order_id),
      subscription_id: sanitize(data.subscription_id) || 'Not provided',
      amount_paid: parseFloat(data.amount_paid).toFixed(2),
      tote_quantity: parseInt(data.tote_quantity) || 0,
      customer_address: sanitize(data.customer_address),
      customer_phone: sanitize(data.customer_phone),
      payment_date: data.payment_date || new Date().toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Development mode check - log data instead of sending email
    // TEMPORARILY DISABLED FOR TESTING - Need to see email templates
    const isLocalDev = false; // Force production mode for testing
    // Original line: const isLocalDev = process.env.NODE_ENV === 'development' || process.env.NETLIFY_DEV === 'true';
    
    if (isLocalDev) {
      console.log('🔧 DEVELOPMENT MODE - Order confirmation data:');
      console.log(JSON.stringify(sanitizedData, null, 2));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Order confirmation processed successfully (development mode)',
          messageId: 'dev-order-' + Date.now(),
          data: sanitizedData
        })
      };
    }

    // Helper functions for billing display
    const getNextBillingDisplay = () => {
      // Calculate next billing date (30 days from today)
      const nextBilling = new Date();
      nextBilling.setDate(nextBilling.getDate() + 30);
      return nextBilling.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getMonthlyBillingAmount = () => {
      // Calculate monthly billing: $10 per tote
      const monthlyAmount = sanitizedData.tote_quantity * 10;
      return monthlyAmount.toFixed(2);
    };

    // Create customer receipt HTML email using the existing template structure
    const customerReceiptTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Instant Closet Tote Storage Receipt</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background-color: #000; color: #ffffff; padding: 30px 40px; text-align: center; }
        .logo-container { background-color: #000; padding: 20px; border-radius: 8px; display: inline-block; }
        .logo { width: 300px; height: auto; display: block; max-width: 100%; }
        .receipt-title { font-size: 24px; font-weight: bold; padding: 15px 25px; background-color: #000; border-radius: 6px; color: #ffffff; margin-top: 15px; }
        .header-divider { width: 100%; height: 2px; background-color: #ffffff; margin: 20px 0 10px 0; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #F8CF1F; display: inline-block; }
        .order-details { background-color: #f8f9fa; border-radius: 8px; padding: 25px; border: 1px solid #e9ecef; }
        .details-grid { display: table; width: 100%; border-collapse: collapse; }
        .details-row { display: table-row; }
        .details-label { display: table-cell; padding: 12px 15px 12px 0; font-weight: 600; color: #495057; vertical-align: top; width: 40%; }
        .details-value { display: table-cell; padding: 12px 0; color: #212529; vertical-align: top; }
        .payment-summary { background: linear-gradient(135deg, #fff3e0 0%, #ffe8cc 100%); border-radius: 8px; padding: 25px; border-left: 4px solid #ff9800; }
        .total-amount { font-size: 24px; font-weight: bold; color: #e65100; text-align: center; margin-top: 15px; padding: 15px; background-color: rgba(255, 255, 255, 0.7); border-radius: 6px; }
        .next-steps { background: linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%); border-radius: 8px; padding: 25px; border-left: 4px solid #2196f3; }
        .next-steps ul { list-style: none; padding-left: 0; }
        .next-steps li { padding: 8px 0; padding-left: 25px; position: relative; }
        .next-steps li::before { content: "✓"; position: absolute; left: 0; color: #4caf50; font-weight: bold; font-size: 16px; }
        .contact-info { background-color: #f8f9fa; border-radius: 8px; padding: 25px; text-align: center; border: 1px solid #e9ecef; }
        .contact-item { margin: 10px 0; font-size: 16px; }
        .contact-item strong { color: #2c3e50; }
        .footer { background-color: #2c3e50; color: #ecf0f1; padding: 30px 40px; text-align: center; }
        .footer p { margin-bottom: 10px; font-size: 14px; }
        .footer-links { margin-top: 20px; }
        .footer-links a { color: #F8CF1F; text-decoration: none; margin: 0 15px; font-weight: 500; }
        .footer-links a:hover { text-decoration: underline; }
        @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .header, .content, .footer { padding: 20px; }
            .receipt-title { font-size: 20px; padding: 12px 12px; }
            .logo { width: 200px; }
            .details-label, .details-value { display: block; width: 100%; padding: 8px 0; }
            .details-label { font-weight: bold; margin-bottom: 5px; }
            .details-value { margin-bottom: 15px; padding-left: 10px; border-left: 3px solid #F8CF1F; }
            .total-amount { font-size: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo-section">
                <div class="logo-container">
                    <img src="https://incandescent-wisp-08c04e.netlify.app/images/logo.webp" 
                         alt="Instant Closet Tote Storage" 
                         class="logo">
                </div>
            </div>
            <div class="header-divider"></div>
            <div class="receipt-title">Payment Receipt</div>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="order-details">
                    <div class="details-grid">
                        <div class="details-row">
                            <div class="details-label">Customer Name:</div>
                            <div class="details-value">${sanitizedData.customer_name}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Email Address:</div>
                            <div class="details-value">${sanitizedData.to_email}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Phone Number:</div>
                            <div class="details-value">${sanitizedData.customer_phone}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Service Address:</div>
                            <div class="details-value">${sanitizedData.customer_address}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Order Details</div>
                <div class="order-details">
                    <div class="details-grid">
                        <div class="details-row">
                            <div class="details-label">Order ID:</div>
                            <div class="details-value">${sanitizedData.order_id}</div>
                        </div>
                        ${sanitizedData.subscription_id !== 'Not provided' ? `
                        <div class="details-row">
                            <div class="details-label">Subscription ID:</div>
                            <div class="details-value">${sanitizedData.subscription_id}</div>
                        </div>
                        ` : ''}
                        <div class="details-row">
                            <div class="details-label">Number of Totes:</div>
                            <div class="details-value">${sanitizedData.tote_quantity} totes</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Service Type:</div>
                            <div class="details-value">Monthly Tote Storage Service</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Payment Date:</div>
                            <div class="details-value">${sanitizedData.payment_date}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Payment Summary</div>
                <div class="payment-summary">
                    <div class="details-grid">
                        <div class="details-row">
                            <div class="details-label">Setup Fee:</div>
                            <div class="details-value">${sanitizedData.amount_paid}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Monthly Rate:</div>
                            <div class="details-value">$10.00 per tote</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Next Billing Date:</div>
                            <div class="details-value">${getNextBillingDisplay()}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Next Billing Amount:</div>
                            <div class="details-value">${getMonthlyBillingAmount()}</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Payment Method:</div>
                            <div class="details-value">Credit/Debit Card</div>
                        </div>
                        <div class="details-row">
                            <div class="details-label">Payment Status:</div>
                            <div class="details-value"><strong style="color: #27ae60;">✓ COMPLETED</strong></div>
                        </div>
                    </div>
                    <div class="total-amount">
                        Total Paid: $${sanitizedData.amount_paid}
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">What Happens Next?</div>
                <div class="next-steps">
                    <ul>
                        <li>We'll contact you within 24 hours to schedule your first tote delivery</li>
                        <li>Our team will deliver your clean, professional totes to your address</li>
                        <li>Fill your totes with items you'd like stored</li>
                        <li>We'll pick up your filled totes and store them in our secure facility</li>
                        <li>Access your items anytime by requesting delivery through our service</li>
                        <li>Your first monthly billing of ${getMonthlyBillingAmount()} will occur on ${getNextBillingDisplay()}</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Questions? We're Here to Help!</div>
                <div class="contact-info">
                    <div class="contact-item">
                        <strong>Phone:</strong> (828) 455-7793
                    </div>
                    <div class="contact-item">
                        <strong>Email:</strong> customerservice@instantclosettotestorage.com
                    </div>
                    <div class="contact-item">
                        <strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Instant Closet Tote Storage</strong></p>
            <p>Professional storage solutions for modern living</p>
            <p>This is an automated receipt. Please save this email for your records.</p>
            
            <div class="footer-links">
                <a href="https://www.instantclosettotestorage.com">Visit Our Website</a>
                <a href="mailto:customerservice@instantclosettotestorage.com">Contact Support</a>
            </div>
        </div>
    </div>
</body>
</html>`;

    // Configure SES email parameters for customer receipt
    const customerEmailParams = {
      Source: 'Instant Closet Tote Storage <no-reply@instantclosettotestorage.com>', // Professional sender name
      Destination: {
        ToAddresses: [sanitizedData.to_email] // Restored: Customer's email
        // ToAddresses: ['sjakesnyder@gmail.com'] // TEST: Using Gmail instead
        // ToAddresses: ['jake@honeybeewebdesign.com'] // TEMPORARILY CHANGED FOR TESTING
      },
      Message: {
        Subject: {
          Data: `Order Receipt - Instant Closet Tote Storage #${sanitizedData.order_id}`, // Professional, no emojis
          Charset: 'UTF-8'
        },
        Body: {
          Html: { 
            Data: customerReceiptTemplate, 
            Charset: 'UTF-8' 
          },
          Text: {
            Data: `INSTANT CLOSET TOTE STORAGE - ORDER RECEIPT\n\n` +
                  `Dear ${sanitizedData.customer_name},\n\n` +
                  `Thank you for your order! Here are your receipt details:\n\n` +
                  `Order ID: ${sanitizedData.order_id}\n` +
                  `${sanitizedData.subscription_id !== 'Not provided' ? `Subscription ID: ${sanitizedData.subscription_id}\n` : ''}` +
                  `Totes: ${sanitizedData.tote_quantity}\n` +
                  `Setup Fee Paid: ${sanitizedData.amount_paid}\n` +
                  `Payment Date: ${sanitizedData.payment_date}\n\n` +
                  `BILLING INFORMATION:\n` +
                  `Next Billing Date: ${getNextBillingDisplay()}\n` +
                  `Next Billing Amount: ${getMonthlyBillingAmount()} (${sanitizedData.tote_quantity} totes × $10.00)\n\n` +
                  `Service Address: ${sanitizedData.customer_address}\n` +
                  `Phone: ${sanitizedData.customer_phone}\n\n` +
                  `We'll contact you within 24 hours to schedule your first delivery.\n\n` +
                  `Questions? Contact us:\n` +
                  `Phone: (828) 455-7793\n` +
                  `Email: customerservice@instantclosettotestorage.com\n\n` +
                  `Thank you for choosing Instant Closet Tote Storage!`,
            Charset: 'UTF-8'
          }
        }
      },
      Tags: [
        {
          Name: 'Source',
          Value: 'Customer-Receipt'
        },
        {
          Name: 'Type', 
          Value: 'Order-Confirmation'
        }
      ]
    };

    console.log('📤 Sending customer receipt via AWS SES...');
    
    // Send customer receipt email
    const customerResult = await ses.sendEmail(customerEmailParams).promise();

    console.log('✅ Customer receipt sent successfully:', customerResult.MessageId);
    console.log('📤 Now sending internal order notification...');

    // Send internal order notification email
    const internalNotificationTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order Received</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background-color: #000; color: #ffffff; padding: 30px 40px; text-align: center; }
        .logo-container { background-color: #000; padding: 20px; border-radius: 8px; display: inline-block; }
        .logo { width: 300px; height: auto; display: block; max-width: 100%; }
        .notification-title { font-size: 24px; font-weight: bold; padding: 15px 25px; background-color: #000; border-radius: 6px; color: #ffffff; margin-top: 15px; }
        .header-divider { width: 100%; height: 2px; background-color: #ffffff; margin: 20px 0 10px 0; }
        .content { padding: 30px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #F8CF1F; padding-bottom: 8px; margin-bottom: 15px; }
        .field { margin-bottom: 12px; padding: 8px 0; }
        .field strong { color: #2c3e50; display: inline-block; min-width: 120px; }
        .highlight { background-color: #e8f5e8; padding: 15px; border-left: 4px solid #27ae60; border-radius: 4px; }
        .footer { background-color: #2c3e50; color: #ecf0f1; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .priority { color: #e74c3c; font-weight: bold; }
        .success { color: #27ae60; font-weight: bold; }
        @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .header, .content, .footer { padding: 20px; }
            .notification-title { font-size: 20px; padding: 12px 12px; }
            .logo { width: 200px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo-section">
                <div class="logo-container">
                    <img src="https://incandescent-wisp-08c04e.netlify.app/images/logo.webp" 
                         alt="Instant Closet Tote Storage" 
                         class="logo">
                </div>
            </div>
            <div class="header-divider"></div>
            <div class="notification-title">New Order Received</div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Customer Information</h2>
                <div class="field"><strong>Name:</strong> ${sanitizedData.customer_name}</div>
                <div class="field"><strong>Email:</strong> <a href="mailto:${sanitizedData.to_email}">${sanitizedData.to_email}</a></div>
                <div class="field"><strong>Phone:</strong> <a href="tel:${sanitizedData.customer_phone}">${sanitizedData.customer_phone}</a></div>
                <div class="field"><strong>Address:</strong> ${sanitizedData.customer_address}</div>
            </div>

            <div class="section">
                <h2>Order Details</h2>
                <div class="highlight">
                    <div class="field"><strong>Order ID:</strong> <span class="priority">${sanitizedData.order_id}</span></div>
                    ${sanitizedData.subscription_id !== 'Not provided' ? `
                    <div class="field"><strong>Subscription ID:</strong> <span class="priority">${sanitizedData.subscription_id}</span></div>
                    ` : ''}
                    <div class="field"><strong>Totes:</strong> <span class="priority">${sanitizedData.tote_quantity} totes</span></div>
                    <div class="field"><strong>Amount Paid:</strong> <span class="success">$${sanitizedData.amount_paid}</span></div>
                    <div class="field"><strong>Payment Date:</strong> ${sanitizedData.payment_date}</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Instant Closet Tote Storage</strong></p>
            <p>Automated order notification from payment system</p>
        </div>
    </div>
</body>
</html>`;

    // Send internal notification
    const internalEmailParams = {
      Source: 'Instant Closet Tote Storage <no-reply@instantclosettotestorage.com>', // Professional sender name
      Destination: {
        ToAddresses: ['jake@honeybeewebdesign.com'] // Restored: Your business email
        // ToAddresses: ['sjakesnyder@gmail.com'] // TEST: Using Gmail instead
      },
      Message: {
        Subject: {
          Data: `New Order Alert: ${sanitizedData.customer_name} - ${sanitizedData.tote_quantity} totes - ${sanitizedData.amount_paid}`, // Professional internal notification
          Charset: 'UTF-8'
        },
        Body: {
          Html: { 
            Data: internalNotificationTemplate, 
            Charset: 'UTF-8' 
          },
          Text: {
            Data: `NEW ORDER RECEIVED!\n\n` +
                  `Customer: ${sanitizedData.customer_name}\n` +
                  `Email: ${sanitizedData.to_email}\n` +
                  `Phone: ${sanitizedData.customer_phone}\n` +
                  `Address: ${sanitizedData.customer_address}\n\n` +
                  `Order ID: ${sanitizedData.order_id}\n` +
                  `${sanitizedData.subscription_id !== 'Not provided' ? `Subscription ID: ${sanitizedData.subscription_id}\n` : ''}` +
                  `Totes: ${sanitizedData.tote_quantity}\n` +
                  `Amount Paid: ${sanitizedData.amount_paid}\n` +
                  `Payment Date: ${sanitizedData.payment_date}`,
            Charset: 'UTF-8'
          }
        }
      },
      ReplyToAddresses: [sanitizedData.to_email],
      Tags: [
        {
          Name: 'Source',
          Value: 'Internal-Order-Notification'
        },
        {
          Name: 'Type', 
          Value: 'New-Order'
        }
      ]
    };

    console.log('📤 Sending internal order notification...');
    console.log('🔍 Internal email params:', {
      From: internalEmailParams.Source,
      To: internalEmailParams.Destination.ToAddresses,
      Subject: internalEmailParams.Message.Subject.Data,
      ReplyTo: internalEmailParams.ReplyToAddresses,
      Tags: internalEmailParams.Tags
    });
    const internalResult = await ses.sendEmail(internalEmailParams).promise();
    console.log('✅ Internal notification sent successfully:', internalResult.MessageId);
    console.log('🎉 Both emails sent! Customer:', customerResult.MessageId, 'Internal:', internalResult.MessageId);

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Order confirmation emails sent successfully',
        customerMessageId: customerResult.MessageId,
        internalMessageId: internalResult.MessageId,
        customerEmail: sanitizedData.to_email,
        orderId: sanitizedData.order_id
      })
    };

  } catch (error) {
    console.error('❌ Error processing order confirmation:', error);
    
    // Return appropriate error response
    const errorResponse = {
      error: 'Failed to send order confirmation',
      message: 'Sorry, there was a problem sending your receipt. Your order was processed successfully, but please contact us if you do not receive your receipt.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};