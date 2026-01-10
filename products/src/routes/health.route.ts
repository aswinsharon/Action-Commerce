import { Router } from 'express';
import { cacheService } from '../common/services/cache.service';
import { Logger } from '../common/loggers/logger';

const router = Router();
const logger = new Logger();

/**
 * Health check endpoint for cache status
 * @route GET /health/cache
 */
router.get('/cache', async (req, res) => {
    try {
        const stats = await cacheService.getStats();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            cache: {
                connected: stats?.connected || false,
                memory: stats?.memory || 'unavailable'
            }
        });
    } catch (error) {
        logger.error(`Cache health check failed: ${error}`);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            cache: {
                connected: false,
                error: error.message
            }
        });
    }
});

/**
 * Clear cache endpoint (admin only)
 * @route DELETE /health/cache
 */
router.delete('/cache', async (req, res) => {
    try {
        // Check if user has admin role (from JWT middleware)
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Admin access required'
            });
        }

        // Clear all product-related cache
        const deletedKeys = await cacheService.delPattern('product*');

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: `Cleared ${deletedKeys} cache keys`
        });
    } catch (error) {
        logger.error(`Cache clear failed: ${error}`);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * Cache statistics endpoint
 * @route GET /health/cache/stats
 */
router.get('/cache/stats', async (req, res) => {
    try {
        const stats = await cacheService.getStats();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            stats: stats
        });
    } catch (error) {
        logger.error(`Cache stats failed: ${error}`);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

export default router;