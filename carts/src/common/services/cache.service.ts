import { RedisConfig } from '../config/redis.config';
import { Logger } from '../loggers/logger';

export class CacheService {
    private redisConfig: RedisConfig;
    private logger: Logger;
    private defaultTTL: number;

    constructor() {
        this.redisConfig = new RedisConfig();
        this.logger = new Logger();
        this.defaultTTL = parseInt(process.env.CACHE_TTL || '3600', 10); // 1 hour default
    }

    async connect(): Promise<void> {
        await this.redisConfig.connect();
    }

    async disconnect(): Promise<void> {
        await this.redisConfig.disconnect();
    }

    /**
     * Set a value in cache with optional TTL
     */
    async set(key: string, value: any, ttl?: number): Promise<boolean> {
        try {
            if (!this.redisConfig.isClientConnected()) {
                this.logger.warn('Redis not connected, skipping cache set');
                return false;
            }

            const client = this.redisConfig.getClient();
            const serializedValue = JSON.stringify(value);
            const expiration = ttl || this.defaultTTL;

            await client.setEx(key, expiration, serializedValue);
            this.logger.debug(`Cache set: ${key} (TTL: ${expiration}s)`);
            return true;
        } catch (error) {
            this.logger.error(`Cache set error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            if (!this.redisConfig.isClientConnected()) {
                this.logger.warn('Redis not connected, skipping cache get');
                return null;
            }

            const client = this.redisConfig.getClient();
            const value = await client.get(key);

            if (value) {
                this.logger.debug(`Cache hit: ${key}`);
                return JSON.parse(value) as T;
            }

            this.logger.debug(`Cache miss: ${key}`);
            return null;
        } catch (error) {
            this.logger.error(`Cache get error for key ${key}: ${error}`);
            return null;
        }
    }

    /**
     * Delete a value from cache
     */
    async del(key: string): Promise<boolean> {
        try {
            if (!this.redisConfig.isClientConnected()) {
                this.logger.warn('Redis not connected, skipping cache delete');
                return false;
            }

            const client = this.redisConfig.getClient();
            const result = await client.del(key);

            if (result > 0) {
                this.logger.debug(`Cache deleted: ${key}`);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Cache delete error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Delete multiple keys matching a pattern
     */
    async delPattern(pattern: string): Promise<number> {
        try {
            if (!this.redisConfig.isClientConnected()) {
                this.logger.warn('Redis not connected, skipping cache pattern delete');
                return 0;
            }

            const client = this.redisConfig.getClient();
            const keys = await client.keys(pattern);

            if (keys.length > 0) {
                const result = await client.del(keys);
                this.logger.debug(`Cache pattern deleted: ${pattern} (${result} keys)`);
                return result;
            }
            return 0;
        } catch (error) {
            this.logger.error(`Cache pattern delete error for pattern ${pattern}: ${error}`);
            return 0;
        }
    }

    /**
     * Check if a key exists in cache
     */
    async exists(key: string): Promise<boolean> {
        try {
            if (!this.redisConfig.isClientConnected()) {
                return false;
            }

            const client = this.redisConfig.getClient();
            const result = await client.exists(key);
            return result === 1;
        } catch (error) {
            this.logger.error(`Cache exists error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Set TTL for an existing key
     */
    async expire(key: string, ttl: number): Promise<boolean> {
        try {
            if (!this.redisConfig.isClientConnected()) {
                return false;
            }

            const client = this.redisConfig.getClient();
            const result = await client.expire(key, ttl);
            return result;
        } catch (error) {
            this.logger.error(`Cache expire error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<any> {
        try {
            if (!this.redisConfig.isClientConnected()) {
                return null;
            }

            const client = this.redisConfig.getClient();
            const info = await client.info('memory');
            return info;
        } catch (error) {
            this.logger.error(`Cache stats error: ${error}`);
            return null;
        }
    }

    /**
     * Generate cache key for cart operations
     */
    generateCartKey(operation: string, identifier: string): string {
        return `cart:${operation}:${identifier}`;
    }

    /**
     * Generate cache key for cart list operations
     */
    generateCartListKey(page: number, pageSize: number, filters?: any): string {
        const filterStr = filters ? JSON.stringify(filters) : 'all';
        return `carts:list:${page}:${pageSize}:${filterStr}`;
    }
}