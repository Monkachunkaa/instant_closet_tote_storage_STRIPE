/**
 * AWS SES EMAIL HANDLER - CONTACT FORM SUBMISSION
 * Replaces EmailJS with AWS SES for contact form emails
 * Handles contact inquiries and lead generation
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
 * Processes contact form submissions and sends emails via AWS SES
 */
exports.handler = async (event, context) => {
  console.log('📧 SES Email Function - Processing request...');
  
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

    // Validate required fields for contact form
    const requiredFields = ['name', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !data[field]?.trim());
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing required fields:', missingFields);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields', 
          missingFields,
          message: `Please provide: ${missingFields.join(', ')}`
        })
      };
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      console.warn('⚠️ Invalid email format:', data.email);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid email address',
          message: 'Please provide a valid email address'
        })
      };
    }

    // Enhanced phone validation - digits only, minimum 10 characters
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(data.phone)) {
      console.warn('⚠️ Invalid phone format:', data.phone);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid phone number',
          message: 'Phone number must contain only digits and be at least 10 digits long'
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
      name: sanitize(data.name),
      email: sanitize(data.email),
      phone: sanitize(data.phone),
      address: sanitize(data.address) || 'Not provided',
      tote_number: sanitize(data.tote_number) || 'Not specified', 
      message: sanitize(data.message) || 'No additional message provided',
      order_cost: sanitize(data.order_cost) || 'Not calculated',
      timestamp: new Date().toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Development mode check - log data instead of sending email
    // TEMPORARILY DISABLED FOR TESTING - Need to see email templates
    const isLocalDev = false; // Force production mode for testing
    // Original line: const isLocalDev = process.env.NODE_ENV === 'development' || process.env.NETLIFY_DEV === 'true';
    
    if (isLocalDev) {
      console.log('🔧 DEVELOPMENT MODE - Contact form data:');
      console.log(JSON.stringify(sanitizedData, null, 2));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Contact form processed successfully (development mode)',
          messageId: 'dev-contact-' + Date.now(),
          data: sanitizedData
        })
      };
    }

    // Determine email type based on whether it's a service inquiry or general contact
    const isServiceInquiry = sanitizedData.address !== 'Not provided' && 
                            sanitizedData.tote_number !== 'Not specified';

    // Create HTML email template
    const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New ${isServiceInquiry ? 'Service Inquiry' : 'Contact Form'} Submission</title>
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
        .highlight { background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; border-radius: 4px; }
        .footer { background-color: #2c3e50; color: #ecf0f1; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .priority { color: #e74c3c; font-weight: bold; }
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
                    <img src="https://instantclosettotestorage.com/images/logo.webp" 
                         alt="Instant Closet Tote Storage" 
                         class="logo">
                </div>
            </div>
            <div class="header-divider"></div>
            <div class="notification-title">${isServiceInquiry ? 'New Service Inquiry' : 'New Contact Form Submission'}</div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Customer Information</h2>
                <div class="field"><strong>Name:</strong> ${sanitizedData.name}</div>
                <div class="field"><strong>Email:</strong> <a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></div>
                <div class="field"><strong>Phone:</strong> <a href="tel:${sanitizedData.phone}">${sanitizedData.phone}</a></div>
                ${sanitizedData.address !== 'Not provided' ? 
                  `<div class="field"><strong>Address:</strong> ${sanitizedData.address}</div>` : ''
                }
            </div>

            ${isServiceInquiry ? `
            <div class="section">
                <h2>Service Request Details</h2>
                <div class="highlight">
                    <div class="field"><strong>Totes Needed:</strong> <span class="priority">${sanitizedData.tote_number}</span></div>
                    <div class="field"><strong>Estimated Cost:</strong> <span class="priority">$${sanitizedData.order_cost}</span></div>
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2>Customer Message</h2>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #2196f3;">
                    ${sanitizedData.message.replace(/\n/g, '<br>')}
                </div>
            </div>

            <div class="section">
                <h2>Submission Details</h2>
                <div class="field"><strong>Received:</strong> ${sanitizedData.timestamp}</div>
                <div class="field"><strong>Type:</strong> ${isServiceInquiry ? 'Service Inquiry' : 'General Contact'}</div>
                ${isServiceInquiry ? '<div class="field priority"><strong>Action Required:</strong> Schedule delivery & setup subscription</div>' : ''}
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Instant Closet Tote Storage</strong></p>
            <p>Automated notification from website contact form</p>
            <p><small>Reply directly to this email to respond to the customer</small></p>
        </div>
    </div>
</body>
</html>`;

    // Create subject line based on inquiry type
    const subject = isServiceInquiry 
      ? `Service Inquiry: ${sanitizedData.name} - ${sanitizedData.tote_number} totes - ${sanitizedData.order_cost}`
      : `New Contact Form: ${sanitizedData.name}`;

    // Configure SES email parameters
    const emailParams = {
      Source: 'Instant Closet Tote Storage <no-reply@instantclosettotestorage.com>', // Professional sender name
      Destination: {
        ToAddresses: ['customerservice@instantclosettotestorage.com'] // Your recipient email
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: { 
            Data: emailTemplate, 
            Charset: 'UTF-8' 
          },
          Text: {
            Data: `NEW ${isServiceInquiry ? 'SERVICE INQUIRY' : 'CONTACT'} FROM WEBSITE\n\n` +
                  `Customer: ${sanitizedData.name}\n` +
                  `Email: ${sanitizedData.email}\n` +
                  `Phone: ${sanitizedData.phone}\n` +
                  `${sanitizedData.address !== 'Not provided' ? `Address: ${sanitizedData.address}\n` : ''}` +
                  `${isServiceInquiry ? `Totes: ${sanitizedData.tote_number}\nCost: $${sanitizedData.order_cost}\n` : ''}` +
                  `\nMessage:\n${sanitizedData.message}\n\n` +
                  `Received: ${sanitizedData.timestamp}`,
            Charset: 'UTF-8'
          }
        }
      },
      ReplyToAddresses: [sanitizedData.email], // Allow direct reply to customer
      Tags: [
        {
          Name: 'Source',
          Value: 'Website-Contact-Form'
        },
        {
          Name: 'Type', 
          Value: isServiceInquiry ? 'Service-Inquiry' : 'General-Contact'
        }
      ]
    };

    console.log('📤 Sending email via AWS SES...');
    
    // Send email via AWS SES
    const result = await ses.sendEmail(emailParams).promise();

    console.log('✅ Email sent successfully:', result.MessageId);

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Contact form submitted successfully',
        messageId: result.MessageId,
        type: isServiceInquiry ? 'service-inquiry' : 'general-contact'
      })
    };

  } catch (error) {
    console.error('❌ Error processing contact form:', error);
    
    // Return appropriate error response
    const errorResponse = {
      error: 'Failed to send contact form',
      message: 'Sorry, there was a problem processing your request. Please try again or contact us directly.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};