/**
 * Load Balancer with Failover Support for Microservices
 * 
 * - Routes requests to appropriate microservices based on URL path.
 * - Supports multiple instances per service.
 * - Implements round-robin load balancing with automatic failover.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const httpProxy = require('http-proxy');
const crypto = require('crypto');

const proxy = httpProxy.createProxyServer({});
const MAX_RETRIES = 3;
const HEALTH_CHECK_INTERVAL = 5000; // ms
const RATE_LIMIT_WINDOW = 60000; // ms
const RATE_LIMIT_MAX = 100; // requests per window
const CACHE_TTL = 10000; // ms

// SSL options (self-signed for demo)
const sslOptions = {
    key: fs.existsSync('key.pem') ? fs.readFileSync('key.pem') : undefined,
    cert: fs.existsSync('cert.pem') ? fs.readFileSync('cert.pem') : undefined
};

/**
 * Configuration for all service routes and their instances.
 * Each key maps to an array of service instances (host + port).
 */

/**
 * Loads service configuration from services.json if available, otherwise uses hardcoded defaults.
 * Enables dynamic service discovery for microservices.
 * @returns {Object} Service configuration mapping paths to instance arrays
 */
function loadServices() {
    if (fs.existsSync('services.json')) {
        return JSON.parse(fs.readFileSync('services.json'));
    }
    // fallback to hardcoded
    return {
        '/products': [
            { host: 'localhost', port: 3001 },
            { host: 'localhost', port: 3002 }
        ],
        '/orders': [
            { host: 'localhost', port: 3003 },
            { host: 'localhost', port: 3004 }
        ],
        '/carts': [
            { host: 'localhost', port: 3005 },
            { host: 'localhost', port: 3006 }
        ],
        '/payments': [
            { host: 'localhost', port: 3007 },
            { host: 'localhost', port: 3008 }
        ],
        '/categories': [
            { host: 'localhost', port: 3009 },
            { host: 'localhost', port: 3010 }
        ]
    };
}

let services = loadServices();
fs.watchFile('services.json', () => {
    services = loadServices();
    console.log('🔄 Service config reloaded');
});

/**
 * Tracks the round-robin index per service path.
 * Used to determine which instance to route to next.
 */
const roundRobinIndex = {};
const leastConnections = {};
const healthyInstances = {};
const rateLimiters = {};
const cache = {};


// Health check logic
/**
 * Performs health checks on all service instances by sending a GET request to /health endpoint.
 * Updates healthyInstances with indices of healthy service instances.
 */
function healthCheck() {
    Object.keys(services).forEach(pathKey => {
        healthyInstances[pathKey] = [];
        services[pathKey].forEach((instance, idx) => {
            http.get({ host: instance.host, port: instance.port, path: '/health', timeout: 2000 }, res => {
                if (res.statusCode === 200) {
                    healthyInstances[pathKey].push(idx);
                }
            }).on('error', () => { });
        });
    });
}
setInterval(healthCheck, HEALTH_CHECK_INTERVAL);
healthCheck();

// Sticky session logic
/**
 * Retrieves or generates a sticky session ID for the client.
 * Sets a cookie if not present to maintain session affinity.
 * @param {http.IncomingMessage} req - Incoming client request
 * @param {http.ServerResponse} res - Outgoing server response
 * @returns {string} Session ID
 */
function getSessionId(req, res) {
    let sid = req.headers.cookie && req.headers.cookie.match(/SID=([a-zA-Z0-9]+)/);
    if (sid) return sid[1];
    sid = crypto.randomBytes(8).toString('hex');
    res.setHeader('Set-Cookie', `SID=${sid}; Path=/; HttpOnly`);
    return sid;
}

// Least-connections load balancing
/**
 * Selects the service instance with the least number of active connections for load balancing.
 * @param {string} pathKey - Service path
 * @param {number[]} tried - Indices of instances already tried
 * @returns {{target: object, index: number} | null} Selected instance and its index
 */
function getLeastConnectionsInstance(pathKey, tried = []) {
    const targets = services[pathKey];
    const healthy = healthyInstances[pathKey] || targets.map((_, idx) => idx);
    const available = healthy.filter(idx => !tried.includes(idx));
    if (available.length === 0) return null;
    let min = Infinity, selectedIdx = available[0];
    available.forEach(idx => {
        leastConnections[pathKey] = leastConnections[pathKey] || {};
        const conns = leastConnections[pathKey][idx] || 0;
        if (conns < min) { min = conns; selectedIdx = idx; }
    });
    return { target: targets[selectedIdx], index: selectedIdx };
}

/**
 * Determines the next service instance to route to using sticky sessions, least-connections, or round-robin.
 * @param {string} pathKey - Service path
 * @param {number[]} tried - Indices of instances already tried
 * @param {http.IncomingMessage} req - Incoming client request
 * @param {http.ServerResponse} res - Outgoing server response
 * @returns {{target: object, index: number} | null} Selected instance and its index
 */
function getNextInstance(pathKey, tried = [], req, res) {
    // Sticky session
    const sid = getSessionId(req, res);
    const targets = services[pathKey];
    const healthy = healthyInstances[pathKey] || targets.map((_, idx) => idx);
    // Try sticky session
    if (req.method === 'GET' && sid) {
        const stickyIdx = parseInt(sid, 16) % targets.length;
        if (!tried.includes(stickyIdx) && healthy.includes(stickyIdx)) {
            return { target: targets[stickyIdx], index: stickyIdx };
        }
    }
    // Least-connections for POST/PUT
    if (['POST', 'PUT'].includes(req.method)) {
        return getLeastConnectionsInstance(pathKey, tried);
    }
    // Round-robin fallback
    const available = healthy.filter(idx => !tried.includes(idx));
    if (available.length === 0) return null;
    roundRobinIndex[pathKey] = (roundRobinIndex[pathKey] + 1 || 0) % available.length;
    const selectedIdx = available[roundRobinIndex[pathKey]];
    return { target: targets[selectedIdx], index: selectedIdx };
}

/**
 * Proxies a request to the selected service instance.
 * Retries on failure up to MAX_RETRIES, trying other instances.
 * 
 * @param {http.IncomingMessage} req - Incoming client request
 * @param {http.ServerResponse} res - Outgoing server response
 * @param {string} pathKey - Service path to route
 * @param {number[]} tried - Array of instance indices already attempted
 */

/**
 * Proxies a request to the selected service instance with automatic failover and retry logic.
 * Tracks least-connections and updates on request completion.
 * @param {http.IncomingMessage} req - Incoming client request
 * @param {http.ServerResponse} res - Outgoing server response
 * @param {string} pathKey - Service path to route
 * @param {number[]} tried - Array of instance indices already attempted
 */
function proxyWithFailover(req, res, pathKey, tried = []) {
    const instance = getNextInstance(pathKey, tried, req, res);
    if (!instance) {
        res.writeHead(502);
        return res.end('No healthy instances available');
    }
    const { target, index } = instance;
    // Track connections for least-connections
    leastConnections[pathKey] = leastConnections[pathKey] || {};
    leastConnections[pathKey][index] = (leastConnections[pathKey][index] || 0) + 1;

    proxy.web(req, res, { target: `http://${target.host}:${target.port}` }, err => {
        console.warn(`⚠️ Failed to reach ${target.host}:${target.port}. Retrying...`);
        leastConnections[pathKey][index]--;
        tried.push(index);
        if (tried.length < MAX_RETRIES) {
            proxyWithFailover(req, res, pathKey, tried);
        } else {
            res.writeHead(502);
            res.end('All instances failed');
        }
    });

    res.on('finish', () => {
        leastConnections[pathKey][index]--;
    });
}

/**
 * Main HTTP server that acts as the entry point (API Gateway).
 * Parses the path and routes the request using proxyWithFailover.
 */

/**
 * Logs request details, response status, and duration for observability.
 * @param {http.IncomingMessage} req - Incoming client request
 * @param {http.ServerResponse} res - Outgoing server response
 * @param {string} [extra] - Additional info to log
 */
function logRequest(req, res, extra = '') {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms ${extra}`);
    });
}

/**
 * Implements rate limiting per IP address to prevent abuse or overload.
 * @param {http.IncomingMessage} req - Incoming client request
 * @param {http.ServerResponse} res - Outgoing server response
 * @returns {boolean} True if request is allowed, false if rate limited
 */
function rateLimit(req, res) {
    const ip = req.connection.remoteAddress;
    const now = Date.now();
    rateLimiters[ip] = rateLimiters[ip] || [];
    rateLimiters[ip] = rateLimiters[ip].filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (rateLimiters[ip].length >= RATE_LIMIT_MAX) {
        res.writeHead(429);
        res.end('Rate limit exceeded');
        return false;
    }
    rateLimiters[ip].push(now);
    return true;
}

/**
 * Generates a cache key for GET requests based on method and URL.
 * @param {http.IncomingMessage} req - Incoming client request
 * @returns {string} Cache key
 */
function cacheKey(req) {
    return req.method + req.url;
}

/**
 * Main request handler for the API Gateway.
 * Applies logging, rate limiting, routing, caching, and proxies requests to microservices.
 * @param {http.IncomingMessage} req - Incoming client request
 * @param {http.ServerResponse} res - Outgoing server response
 */
function handleRequest(req, res) {
    logRequest(req, res);
    // Rate limiting
    if (!rateLimit(req, res)) return;

    // Routing by method/header
    let urlPath = req.url.split('/')[1];
    let pathKey = '/' + urlPath;
    if (req.headers['x-service']) {
        pathKey = '/' + req.headers['x-service'];
    }

    if (!services[pathKey]) {
        res.writeHead(404);
        return res.end('Service not found');
    }

    // Caching for GET
    if (req.method === 'GET') {
        const key = cacheKey(req);
        if (cache[key] && Date.now() - cache[key].ts < CACHE_TTL) {
            res.writeHead(200, cache[key].headers);
            res.end(cache[key].body);
            return;
        }
        // Proxy and cache response
        const _end = res.end;
        let chunks = [];
        res.end = function (body) {
            chunks.push(body);
            cache[key] = {
                ts: Date.now(),
                body: body,
                headers: res.getHeaders()
            };
            _end.call(res, body);
        };
    }

    proxyWithFailover(req, res, pathKey, []);
}

let shuttingDown = false;
/**
 * Initiates graceful shutdown of the server, allowing in-flight requests to complete.
 * @param {http.Server} server - The HTTP/HTTPS server instance
 */
function gracefulShutdown(server) {
    shuttingDown = true;
    console.log('🛑 Graceful shutdown initiated...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
}
process.on('SIGTERM', () => gracefulShutdown(server));
process.on('SIGINT', () => gracefulShutdown(server));

const server = sslOptions.key && sslOptions.cert
    ? https.createServer(sslOptions, handleRequest)
    : http.createServer(handleRequest);

server.listen(8000, () => {
    console.log(`🚀 API Gateway Load Balancer with Failover listening on ${sslOptions.key ? 'https' : 'http'}://localhost:8000`);
});