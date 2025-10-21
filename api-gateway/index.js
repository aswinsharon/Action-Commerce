const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API Gateway is running',
        timestamp: new Date().toISOString()
    });
});

// Proxy configurations for microservices
const services = {
    auth: {
        target: process.env.USER_MANAGEMENT_URL || 'http://localhost:6001',
        pathRewrite: { '^/auth': '/auth' }
    },
    users: {
        target: process.env.USER_MANAGEMENT_URL || 'http://localhost:6001',
        pathRewrite: { '^/users': '/users' }
    },
    products: {
        target: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:6002',
        pathRewrite: { '^/products': '/products' }
    },
    categories: {
        target: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:6003',
        pathRewrite: { '^/categories': '/categories' }
    },
    carts: {
        target: process.env.CART_SERVICE_URL || 'http://localhost:6004',
        pathRewrite: { '^/carts': '/carts' }
    }
};

// Create proxy middleware for each service
Object.keys(services).forEach(path => {
    const config = services[path];
    app.use(`/${path}`, createProxyMiddleware({
        target: config.target,
        changeOrigin: true,
        pathRewrite: config.pathRewrite,
        onError: (err, req, res) => {
            console.error(`Proxy error for ${path}:`, err.message);
            res.status(503).json({
                error: 'Service Unavailable',
                message: `${path} service is currently unavailable`,
                service: path
            });
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`Proxying ${req.method} ${req.url} to ${config.target}`);
        }
    }));
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        availableServices: Object.keys(services)
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log('Available services:', Object.keys(services));
});