import express from "express";
import { healthController } from "../controllers/health.controller";
import { authenticateToken, authorizeRoles } from "../common/middlewares/auth.middleware";

const router = express.Router();

/**
 * Health Check
 * GET /health
 */
router.get('/', healthController.healthCheck);

/**
 * Cache Statistics
 * GET /health/cache
 */
router.get('/cache', authenticateToken, healthController.cacheStats);

/**
 * Clear Cache (Admin only)
 * DELETE /health/cache
 */
router.delete('/cache', authenticateToken, authorizeRoles('admin'), healthController.clearCache);

export default router;