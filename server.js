require('dotenv').config({ path: './email.env' });
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (['http://localhost:5501', 'http://127.0.0.1:5501'].indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Email configuration with better error handling
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // For development only
      }
    });

    // Verify connection
    transporter.verify((error) => {
      if (error) {
        console.error('Email configuration error:', error);
      } else {
        console.log('Email server is ready to send messages');
      }
    });
  } catch (error) {
    console.error('Email transport creation failed:', error);
  }
} else {
  console.warn('Email credentials not configured - email functionality disabled');
}

// In-memory database
const orders = [];

// Single, improved orders endpoint
app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;

    // Enhanced validation
    const errors = [];
    if (!order || typeof order !== 'object') {
      errors.push('Invalid request format');
    }
    if (!order.customer || typeof order.customer !== 'object') {
      errors.push('Missing or invalid customer data');
    } else {
      if (!order.customer.email || !/^\S+@\S+\.\S+$/.test(order.customer.email)) {
        errors.push('Invalid email address');
      }
    }
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      errors.push('Invalid items array');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
        message: 'Validation failed'
      });
    }

    // Generate order details
    order.orderNumber = order.orderNumber || `BH-${Date.now()}`;
    order.orderDate = new Date().toISOString();
    order.status = 'Processing';
    
    // Calculate financials
    order.subtotal = order.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
    
    order.tax = order.subtotal * 0.08; // 8% tax
    order.total = order.subtotal + order.tax;

    // Save order
    orders.push(order);
    console.log('New order saved:', order.orderNumber);

    // Send emails if configured
    if (transporter) {
      try {
        const mailOptions = {
          from: `"Billionaire Hive" <${process.env.EMAIL_USER}>`,
          to: order.customer.email,
          subject: `Order Confirmation #${order.orderNumber}`,
          html: generateCustomerEmail(order),
          text: `Thank you for your order #${order.orderNumber}`
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent');
        
        // Send admin notification
        if (process.env.ADMIN_EMAIL) {
          await transporter.sendMail({
            from: `"Billionaire Hive" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `New Order #${order.orderNumber}`,
            html: generateAdminEmail(order)
          });
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue processing order even if email fails
      }
    }

    res.status(201).json({
      success: true,
      orderNumber: order.orderNumber,
      message: 'Order processed successfully',
      orderSummary: {
        itemCount: order.items.length,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total
      }
    });

  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Helper functions (keep your existing implementations)
function generateCustomerEmail(order) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #d4af37;">Thank you for your order, ${order.customer.firstName}!</h1>
      <p>Your order <strong>#${order.orderNumber}</strong> has been received.</p>
      
      <h2 style="color: #d4af37; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h2>
      ${order.items.map(item => `
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f5f5f5;">
          <h3 style="margin: 0 0 5px 0;">${item.brand} ${item.model}</h3>
          <p style="margin: 5px 0;">Price: ${formatPrice(item.price)} × ${item.quantity}</p>
          <p style="margin: 5px 0; font-weight: bold;">Total: ${formatPrice(item.price * item.quantity)}</p>
        </div>
      `).join('')}
      
      <div style="margin-top: 20px; background: #f9f9f9; padding: 15px;">
        <h3 style="margin-top: 0; color: #d4af37;">Order Totals</h3>
        <p style="margin: 5px 0;">Subtotal: ${formatPrice(order.subtotal)}</p>
        <p style="margin: 5px 0;">Tax: ${formatPrice(order.tax)}</p>
        <p style="margin: 5px 0; font-weight: bold; font-size: 1.1em;">Total: ${formatPrice(order.total)}</p>
      </div>
      
      <p style="margin-top: 20px;">Our team will contact you within 24 hours.</p>
    </div>
  `;
}

function generateAdminEmail(order) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #d4af37;">New Order Notification</h1>
      <h2>Order #${order.orderNumber}</h2>
      
      <h3 style="color: #d4af37; border-bottom: 1px solid #eee; padding-bottom: 10px;">Customer Information</h3>
      <p><strong>Name:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
      <p><strong>Email:</strong> ${order.customer.email}</p>
      <p><strong>Phone:</strong> ${order.customer.phone}</p>
      
      <h3 style="color: #d4af37; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 20px;">Order Details</h3>
      ${order.items.map(item => `
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f5f5f5;">
          <h4 style="margin: 0 0 5px 0;">${item.brand} ${item.model}</h4>
          <p style="margin: 5px 0;">Price: ${formatPrice(item.price)} × ${item.quantity}</p>
        </div>
      `).join('')}
      
      <div style="margin-top: 20px; background: #f9f9f9; padding: 15px;">
        <h4 style="margin-top: 0; color: #d4af37;">Order Totals</h4>
        <p style="margin: 5px 0;">Total: ${formatPrice(order.total)}</p>
      </div>
    </div>
  `;
}

function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    time: new Date(),
    ordersProcessed: orders.length,
    emailConfigured: !!transporter
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/orders`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});