import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { Logger } from '../loggers/logger';

const logger = new Logger();

export interface CacheOptions {
    ttl?: number;
    keyGenerator?: (req: Request) => string;
    condition?: (req: Request) => boolean;
}

/**
 * Cache middleware for GET requests
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Check condition if provided
        if (options.condition && !options.condition(req)) {
            return next();
        }

        try {
            // Generate cache key
            const cacheKey = options.keyGenerator
                ? options.keyGenerator(req)
                : `${req.originalUrl}:${JSON.stringify(req.query)}`;

            // Try to get from cache
            const cachedData = await cacheService.get(cacheKey);

            if (cachedData) {
                logger.debug(`Cache hit for key: ${cacheKey}`);
                return res.json(cachedData);
            }

            // Store original json method
            const originalJson = res.json;

            // Override json method to cache the response
            res.json = function (data: any) {
                // Cache the response
                const ttl = options.ttl || 3600; // 1 hour default
                cacheService.set(cacheKey, data, ttl).catch(error => {
                    logger.error(`Failed to cache response for key ${cacheKey}: ${error}`);
                });

                // Call original json method
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            logger.error(`Cache middleware error: ${error}`);
            next();
        }
    };
};

/**
 * Cache invalidation middleware
 */
export const invalidateCacheMiddleware = (patterns: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Store original methods
        const originalJson = res.json;
        const originalSend = res.send;

        const invalidateCache = async () => {
            try {
                for (const pattern of patterns) {
                    await cacheService.delPattern(pattern);
                    logger.debug(`Invalidated cache pattern: ${pattern}`);
                }
            } catch (error) {
                logger.error(`Cache invalidation error: ${error}`);
            }
        };

        // Override response methods to invalidate cache on successful operations
        res.json = function (data: any) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                invalidateCache();
            }
            return originalJson.call(this, data);
        };

        res.send = function (data: any) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                invalidateCache();
            }
            return originalSend.call(this, data);
        };

        next();
    };
};

/**
 * Initialize cache service
 */
export const initializeCache = async (): Promise<void> => {
    try {
        await cacheService.connect();
        logger.info('Cache service initialized successfully');
    } catch (error) {
        logger.error(`Failed to initialize cache service: ${error}`);
        throw error;
    }
};

/**
 * Shutdown cache service
 */
export const shutdownCache = async (): Promise<void> => {
    try {
        await cacheService.disconnect();
        logger.info('Cache service shutdown successfully');
    } catch (error) {
        logger.error(`Failed to shutdown cache service: ${error}`);
        throw error;
    }
};