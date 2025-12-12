import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/cache.service';
import { Logger } from '../loggers/logger';

interface CacheOptions {
    ttl?: number;
    keyGenerator?: (req: Request) => string;
    skipCache?: (req: Request) => boolean;
}

export class CacheMiddleware {
    private cacheService: CacheService;
    private logger: Logger;

    constructor() {
        this.cacheService = new CacheService();
        this.logger = new Logger();
    }

    async initialize(): Promise<void> {
        await this.cacheService.connect();
    }

    async shutdown(): Promise<void> {
        await this.cacheService.disconnect();
    }

    /**
     * Cache middleware for GET requests
     */
    cache(options: CacheOptions = {}) {
        return async (req: Request, res: Response, next: NextFunction) => {
            // Only cache GET requests
            if (req.method !== 'GET') {
                return next();
            }

            // Skip cache if specified
            if (options.skipCache && options.skipCache(req)) {
                return next();
            }

            try {
                const cacheKey = options.keyGenerator
                    ? options.keyGenerator(req)
                    : this.generateDefaultKey(req);

                // Try to get from cache
                const cachedData = await this.cacheService.get(cacheKey);

                if (cachedData) {
                    this.logger.debug(`Cache hit for key: ${cacheKey}`);
                    return res.json(cachedData);
                }

                // Store original json method
                const originalJson = res.json.bind(res);

                // Override json method to cache the response
                res.json = (data: any) => {
                    // Only cache successful responses
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        this.cacheService.set(cacheKey, data, options.ttl)
                            .catch(error => {
                                this.logger.error(`Failed to cache response: ${error}`);
                            });
                    }
                    originalJson(data);
                    return res;
                };

                next();
            } catch (error) {
                this.logger.error(`Cache middleware error: ${error}`);
                next();
            }
        };
    }

    /**
     * Invalidate cache middleware for POST, PUT, DELETE requests
     */
    invalidateCache(patterns: string[] | ((req: Request) => string[])) {
        return async (req: Request, res: Response, next: NextFunction) => {
            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to invalidate cache after successful operations
            res.json = (data: any) => {
                // Only invalidate cache for successful operations
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Use setImmediate to avoid blocking the response
                    setImmediate(async () => {
                        try {
                            const invalidationPatterns = typeof patterns === 'function'
                                ? patterns(req)
                                : patterns;

                            for (const pattern of invalidationPatterns) {
                                await this.cacheService.delPattern(pattern);
                                this.logger.debug(`Invalidated cache pattern: ${pattern}`);
                            }
                        } catch (error) {
                            this.logger.error(`Cache invalidation error: ${error}`);
                        }
                    });
                }
                originalJson(data);
                return res;
            };

            next();
        };
    }

    /**
     * Generate default cache key from request
     */
    private generateDefaultKey(req: Request): string {
        const { path, query } = req;
        const queryString = Object.keys(query).length > 0
            ? JSON.stringify(query)
            : '';
        return `api:${path}:${queryString}`;
    }

    /**
     * Generate cart-specific cache key
     */
    generateCartKey(req: Request): string {
        const { path, query, params } = req;
        const identifier = params.id || params.key || params.customerId || 'all';
        return `cart:${path}:${identifier}:${JSON.stringify(query)}`;
    }

    /**
     * Generate cart invalidation patterns
     */
    generateCartInvalidationPatterns(req: Request): string[] {
        const patterns = ['cart:*', 'carts:*'];

        // Add specific patterns based on the request
        if (req.params.id) {
            patterns.push(`cart:*:${req.params.id}:*`);
        }
        if (req.params.key) {
            patterns.push(`cart:*:${req.params.key}:*`);
        }
        if (req.params.customerId) {
            patterns.push(`cart:*:${req.params.customerId}:*`);
        }

        return patterns;
    }
}

// Create singleton instance
export const cacheMiddleware = new CacheMiddleware();