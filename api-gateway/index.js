const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API Gateway is running',
        timestamp: new Date().toISOString(),
        services: Object.keys(services)
    });
});

// Service health check endpoint
app.get('/health/services', async (req, res) => {
    const healthChecks = await Promise.allSettled(
        Object.entries(services).map(async ([name, config]) => {
            try {
                const response = await axios.get(`${config.target}/health`, { timeout: 3000 });
                return { service: name, status: 'healthy', url: config.target };
            } catch (error) {
                return { service: name, status: 'unhealthy', url: config.target, error: error.message };
            }
        })
    );

    const results = healthChecks.map(result => result.value || result.reason);
    const allHealthy = results.every(r => r.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'OK' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        services: results
    });
});

// Proxy configurations for microservices
const services = {
    auth: {
        target: process.env.USER_MANAGEMENT_URL || 'http://localhost:6001',
        pathRewrite: { '^/api/auth': '/auth' }
    },
    users: {
        target: process.env.USER_MANAGEMENT_URL || 'http://localhost:6001',
        pathRewrite: { '^/api/users': '/users' }
    },
    products: {
        target: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:6002',
        pathRewrite: { '^/api/products': '/products' }
    },
    categories: {
        target: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:6003',
        pathRewrite: { '^/api/categories': '/categories' }
    },
    carts: {
        target: process.env.CART_SERVICE_URL || 'http://localhost:6004',
        pathRewrite: { '^/api/carts': '/carts' }
    }
};

// Common proxy options
const createProxyOptions = (serviceName, config) => ({
    target: config.target,
    changeOrigin: true,
    pathRewrite: config.pathRewrite,
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
        console.error(`[ERROR] Proxy error for ${serviceName}:`, err.message);
        if (!res.headersSent) {
            res.status(503).json({
                statusCode: 503,
                message: `${serviceName} service is currently unavailable`,
                errors: [{
                    code: 'ServiceUnavailable',
                    message: err.message
                }]
            });
        }
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${config.target}${req.url}`);

        // Forward important headers
        if (req.headers['x-client-id']) {
            proxyReq.setHeader('x-client-id', req.headers['x-client-id']);
        }
        if (req.headers['authorization']) {
            proxyReq.setHeader('authorization', req.headers['authorization']);
        }

        // Handle body for POST/PUT/PATCH
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[RESPONSE] ${proxyRes.statusCode} from ${serviceName}`);
    }
});

// Create proxy middleware for each service with /api prefix
Object.keys(services).forEach(serviceName => {
    const config = services[serviceName];
    app.use(`/api/${serviceName}`, createProxyMiddleware(createProxyOptions(serviceName, config)));
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Action Commerce API Gateway',
        version: '1.0.0',
        endpoints: {
            health: {
                gateway: '/health',
                services: '/health/services'
            },
            services: {
                auth: '/api/auth/*',
                users: '/api/users/*',
                products: '/api/products/*',
                categories: '/api/categories/*',
                carts: '/api/carts/*'
            },
            documentation: '/api/docs'
        }
    });
});

// Catch-all for undefined routes (must be last)
app.use((req, res) => {
    res.status(404).json({
        statusCode: 404,
        message: 'The requested endpoint does not exist',
        errors: [{
            code: 'NotFound',
            message: `Route ${req.originalUrl} not found`
        }],
        availableServices: Object.keys(services).map(s => `/api/${s}`)
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(err.status || 500).json({
        statusCode: err.status || 500,
        message: err.message || 'Internal Server Error',
        errors: [{
            code: 'InternalError',
            message: err.message
        }]
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`\n🚀 API Gateway running on port ${PORT}`);
    console.log(`📍 Gateway URL: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log('\n📦 Available services:');
    Object.entries(services).forEach(([name, config]) => {
        console.log(`   - ${name.padEnd(12)} -> ${config.target}`);
    });
    console.log('\n');
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n🛑 Shutting down API Gateway...');
    server.close(() => {
        console.log('✅ API Gateway closed');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);