const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

/**
 * Middleware to authenticate JWT tokens.
 * Skips authentication for public endpoints.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const authenticateToken = (req, res, next) => {
    const publicEndpoints = ['/health', '/health/services', '/api', '/api/auth/login', '/api/auth/register'];
    if (publicEndpoints.includes(req.path) || req.path.startsWith('/api/auth/')) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            statusCode: 401,
            message: 'Access token is required',
            errors: [{
                code: 'Unauthorized',
                message: 'No token provided'
            }]
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Add user info to headers for downstream services
        req.headers['x-user-id'] = decoded.id;
        req.headers['x-user-email'] = decoded.email;
        req.headers['x-user-role'] = decoded.role;
        console.log(`[AUTH] Token verified for user: ${decoded.email} (${decoded.role})`);
        next();
    } catch (error) {
        console.error(`[AUTH] Token verification failed:`, error.message);
        console.error(`[AUTH] Token format check - parts: ${token.split('.').length} (should be 3)`);
        return res.status(403).json({
            statusCode: 403,
            message: 'Invalid or expired token',
            errors: [{
                code: 'Forbidden',
                message: error.message
            }]
        });
    }
};

// Apply authentication middleware globally
app.use(authenticateToken);

/**
 * Health check endpoint to verify API Gateway status.
 * @route GET /health
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API Gateway is running',
        timestamp: new Date().toISOString(),
        services: Object.keys(services)
    });
});

/**
 * Service health check endpoint.
 * Pings all downstream services to check their availability.
 * @route GET /health/services
 */
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
    },
    payments: {
        target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:6005',
        pathRewrite: { '^/api/payments': '/payments' }
    }
};

/**
 * Creates proxy options for a specific service.
 * 
 * @param {string} serviceName - Name of the service
 * @param {Object} config - Service configuration object
 * @returns {Object} Proxy middleware options
 */
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

        if (req.headers['x-client-id']) {
            proxyReq.setHeader('x-client-id', req.headers['x-client-id']);
        }
        if (req.headers['authorization']) {
            proxyReq.setHeader('authorization', req.headers['authorization']);
        }
        if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        }
        if (req.headers['x-user-email']) {
            proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
        }
        if (req.headers['x-user-role']) {
            proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
        }

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

Object.keys(services).forEach(serviceName => {
    const config = services[serviceName];
    app.use(`/api/${serviceName}`, createProxyMiddleware(createProxyOptions(serviceName, config)));
});

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
    console.log(`\n API Gateway running on port ${PORT}`);
    console.log(`Gateway URL: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log('\n Available services:');
    Object.entries(services).forEach(([name, config]) => {
        console.log(`   - ${name.padEnd(12)} -> ${config.target}`);
    });
    console.log('\n');
});

/**
 * Gracefully shuts down the API Gateway.
 * Closes the server and exits the process.
 */
const gracefulShutdown = () => {
    console.log('\nShutting down API Gateway...');
    server.close(() => {
        console.log('API Gateway closed');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);