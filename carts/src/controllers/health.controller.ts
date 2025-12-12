import { Request, Response } from 'express';
import { CacheService } from '../common/services/cache.service';
import HTTP_STATUS from '../common/constants/httpStatus';
import { Logger } from '../common/loggers/logger';

class HealthController {
    private cacheService: CacheService;
    private logger: Logger;

    constructor() {
        this.cacheService = new CacheService();
        this.logger = new Logger();
    }

    /**
     * Health check endpoint
     */
    healthCheck = async (req: Request, res: Response): Promise<void> => {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    cache: 'unknown',
                    database: 'unknown'
                }
            };

            // Check Redis connection
            try {
                await this.cacheService.connect();
                const stats = await this.cacheService.getStats();
                health.services.cache = stats ? 'healthy' : 'unhealthy';
            } catch (error) {
                health.services.cache = 'unhealthy';
                this.logger.error(`Cache health check failed: ${error}`);
            }

            // You can add database health check here if needed
            health.services.database = 'healthy'; // Assuming MongoDB is healthy

            const overallHealthy = Object.values(health.services).every(status => status === 'healthy');

            res.status(overallHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE).json(health);
        } catch (error) {
            this.logger.error(`Health check error: ${error}`);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Health check failed'
            });
        }
    };

    /**
     * Cache statistics endpoint
     */
    cacheStats = async (req: Request, res: Response): Promise<void> => {
        try {
            await this.cacheService.connect();
            const stats = await this.cacheService.getStats();

            if (stats) {
                res.status(HTTP_STATUS.OK).json({
                    status: 'success',
                    data: stats
                });
            } else {
                res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
                    status: 'error',
                    message: 'Cache not available'
                });
            }
        } catch (error) {
            this.logger.error(`Cache stats error: ${error}`);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: 'Failed to get cache statistics'
            });
        }
    };

    /**
     * Clear cache endpoint (for admin use)
     */
    clearCache = async (req: Request, res: Response): Promise<void> => {
        try {
            const { pattern } = req.query;
            const cachePattern = pattern as string || 'cart:*';

            await this.cacheService.connect();
            const deletedCount = await this.cacheService.delPattern(cachePattern);

            res.status(HTTP_STATUS.OK).json({
                status: 'success',
                message: `Cleared ${deletedCount} cache entries`,
                pattern: cachePattern
            });
        } catch (error) {
            this.logger.error(`Clear cache error: ${error}`);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: 'Failed to clear cache'
            });
        }
    };
}

export const healthController = new HealthController();