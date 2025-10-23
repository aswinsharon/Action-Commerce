import express from 'express';
import { authenticateToken, authorizeRoles } from '../common/middlewares/auth.middleware';

const router = express.Router();

/**
 * GET /profile
 * Get current user profile (authenticated users only)
 */
router.get('/profile', authenticateToken, (req: any, res) => {
    res.json({
        message: 'Profile accessed successfully',
        user: req.user
    });
});

/**
 * GET /test
 * Test endpoint without authentication
 */
router.get('/test', (req, res) => {
    res.json({ message: 'This endpoint does not require authentication' });
});

/**
 * GET /admin
 * Admin only endpoint
 */
router.get('/admin', authenticateToken, authorizeRoles('admin'), (req, res) => {
    res.json({ message: 'Admin access granted' });
});

/**
 * GET /manager
 * Manager and admin access
 */
router.get('/manager', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
    res.json({ message: 'Manager access granted' });
});

export default router;