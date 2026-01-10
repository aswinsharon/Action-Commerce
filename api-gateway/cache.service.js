const { createClient } = require('redis');

class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.defaultTTL = parseInt(process.env.CACHE_TTL || '3600', 10); // 1 hour default

        this.init();
    }

    init() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        this.client = createClient({
            url: redisUrl,
            socket: {
                connectTimeout: 60000,
            },
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.on('connect', () => {
            console.log('[CACHE] Redis client connected');
        });

        this.client.on('ready', () => {
            console.log('[CACHE] Redis client ready');
            this.isConnected = true;
        });

        this.client.on('error', (err) => {
            console.error(`[CACHE] Redis client error: ${err}`);
            this.isConnected = false;
        });

        this.client.on('end', () => {
            console.log('[CACHE] Redis client disconnected');
            this.isConnected = false;
        });
    }

    async connect() {
        try {
            if (!this.isConnected) {
                await this.client.connect();
                console.log('[CACHE] Redis connected successfully');
            }
        } catch (error) {
            console.error(`[CACHE] Failed to connect to Redis: ${error}`);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.isConnected) {
                await this.client.disconnect();
                console.log('[CACHE] Redis disconnected successfully');
            }
        } catch (error) {
            console.error(`[CACHE] Failed to disconnect from Redis: ${error}`);
            throw error;
        }
    }

    /**
     * Set a value in cache with optional TTL
     */
    async set(key, value, ttl) {
        try {
            if (!this.isConnected) {
                console.warn('[CACHE] Redis not connected, skipping cache set');
                return false;
            }

            const serializedValue = JSON.stringify(value);
            const expiration = ttl || this.defaultTTL;

            await this.client.setEx(key, expiration, serializedValue);
            console.log(`[CACHE] Cache set: ${key} (TTL: ${expiration}s)`);
            return true;
        } catch (error) {
            console.error(`[CACHE] Cache set error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Get a value from cache
     */
    async get(key) {
        try {
            if (!this.isConnected) {
                console.warn('[CACHE] Redis not connected, skipping cache get');
                return null;
            }

            const value = await this.client.get(key);

            if (value) {
                console.log(`[CACHE] Cache hit: ${key}`);
                return JSON.parse(value);
            }

            console.log(`[CACHE] Cache miss: ${key}`);
            return null;
        } catch (error) {
            console.error(`[CACHE] Cache get error for key ${key}: ${error}`);
            return null;
        }
    }

    /**
     * Delete a value from cache
     */
    async del(key) {
        try {
            if (!this.isConnected) {
                console.warn('[CACHE] Redis not connected, skipping cache delete');
                return false;
            }

            const result = await this.client.del(key);
            console.log(`[CACHE] Cache delete: ${key} (deleted: ${result})`);
            return result > 0;
        } catch (error) {
            console.error(`[CACHE] Cache delete error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Delete keys matching a pattern
     */
    async delPattern(pattern) {
        try {
            if (!this.isConnected) {
                console.warn('[CACHE] Redis not connected, skipping pattern delete');
                return 0;
            }

            const keys = await this.client.keys(pattern);

            if (keys.length === 0) {
                return 0;
            }

            const result = await this.client.del(keys);
            console.log(`[CACHE] Cache pattern delete: ${pattern} (deleted: ${result} keys)`);
            return result;
        } catch (error) {
            console.error(`[CACHE] Cache pattern delete error for pattern ${pattern}: ${error}`);
            return 0;
        }
    }

    /**
     * Check if a key exists
     */
    async exists(key) {
        try {
            if (!this.isConnected) {
                return false;
            }

            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`[CACHE] Cache exists error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Generate standardized service health cache key
     */
    generateServiceHealthKey(serviceName) {
        return `service_health:${serviceName}`;
    }

    /**
     * Generate standardized route cache key
     */
    generateRouteKey(path, method, query) {
        const queryStr = query ? JSON.stringify(query) : '';
        return `route:${method}:${path}:${Buffer.from(queryStr).toString('base64')}`;
    }

    /**
     * Generate standardized user session cache key
     */
    generateUserSessionKey(userId) {
        return `user_session:${userId}`;
    }
}

// Export singleton instance
const cacheService = new CacheService();
module.exports = cacheService;