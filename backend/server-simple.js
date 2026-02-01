const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple in-memory storage for demo
let users = [
  {
    _id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // admin123
    role: 'admin'
  }
];

let uploadJobs = [];
let records = [];
let reconciliationResults = [];

// Simple auth middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  // Simple token validation (in real app, use JWT)
  if (token === 'demo-token') {
    req.user = users[0]; // Admin user
    next();
  } else {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@example.com' && password === 'admin123') {
    res.json({
      message: 'Login successful',
      token: 'demo-token',
      user: {
        _id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/dashboard/summary', authenticate, (req, res) => {
  res.json({
    uploads: {
      processing: 0,
      completed: 1,
      failed: 0,
      totalUploads: 1,
      totalRecords: 15,
      processedRecords: 15,
      errorRecords: 0
    },
    reconciliation: {
      matched: 8,
      partially_matched: 3,
      not_matched: 2,
      duplicate: 2,
      total: 15,
      accuracy: 73.33
    }
  });
});

app.get('/api/dashboard/trends', authenticate, (req, res) => {
  res.json({
    reconciliationTrends: [
      { date: '2024-01-25', accuracy: 70, total: 10 },
      { date: '2024-01-26', accuracy: 75, total: 12 },
      { date: '2024-01-27', accuracy: 73, total: 15 }
    ],
    uploadTrends: [
      { _id: '2024-01-25', uploads: 1, totalRecords: 10 },
      { _id: '2024-01-26', uploads: 1, totalRecords: 12 },
      { _id: '2024-01-27', uploads: 1, totalRecords: 15 }
    ]
  });
});

app.get('/api/dashboard/activity', authenticate, (req, res) => {
  res.json({
    recentUploads: [
      {
        _id: '1',
        originalName: 'transactions.csv',
        status: 'completed',
        processedRecords: 15,
        createdAt: new Date().toISOString(),
        uploadedBy: { username: 'admin' }
      }
    ],
    recentReconciliations: []
  });
});

app.get('/api/reconciliation/results', authenticate, (req, res) => {
  const mockResults = [
    {
      _id: '1',
      matchStatus: 'matched',
      matchScore: 1.0,
      differences: [],
      uploadedRecordId: {
        transactionId: 'TXN001',
        amount: 1500.00,
        referenceNumber: 'REF001'
      },
      systemRecordId: {
        transactionId: 'TXN001',
        amount: 1500.00,
        referenceNumber: 'REF001'
      }
    },
    {
      _id: '2',
      matchStatus: 'partially_matched',
      matchScore: 0.8,
      differences: [
        {
          field: 'amount',
          uploadedValue: 1800.00,
          systemValue: 1799.50,
          variance: 0.0028
        }
      ],
      uploadedRecordId: {
        transactionId: 'TXN008',
        amount: 1800.00,
        referenceNumber: 'REF008'
      },
      systemRecordId: {
        transactionId: 'TXN008',
        amount: 1799.50,
        referenceNumber: 'REF008'
      }
    }
  ];

  res.json({
    results: mockResults,
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      pages: 1
    }
  });
});

app.get('/api/upload/jobs', authenticate, (req, res) => {
  res.json({
    jobs: [
      {
        _id: '1',
        jobId: 'demo-job-1',
        originalName: 'transactions.csv',
        status: 'completed',
        totalRecords: 15,
        processedRecords: 15,
        errorRecords: 0,
        createdAt: new Date().toISOString(),
        uploadedBy: { username: 'admin', email: 'admin@example.com' }
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      pages: 1
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Demo mode - using in-memory data'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Demo server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:3000`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`👤 Login: admin@example.com / admin123`);
});

module.exports = app;