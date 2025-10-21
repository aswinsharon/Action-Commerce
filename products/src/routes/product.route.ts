import express from 'express';
import { authenticateToken, authorizeRoles } from '../common/middlewares/auth.middleware';

const router = express.Router();

/**
 * GET /
 * Get all products (public access)
 */
router.get('/', (req, res) => {
    res.json({
        message: 'Products endpoint - Get all products',
        query: req.query
    });
});

/**
 * GET /:productId
 * Get product by ID (public access)
 */
router.get('/:productId', (req, res) => {
    res.json({
        message: `Get product ${req.params.productId}`,
        productId: req.params.productId
    });
});

/**
 * POST /
 * Create new product (admin/manager only)
 */
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
    res.json({
        message: 'Create new product',
        body: req.body,
        user: (req as any).user
    });
});

/**
 * PATCH /:productId
 * Update product (admin/manager only)
 */
router.patch('/:productId', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
    res.json({
        message: `Update product ${req.params.productId}`,
        productId: req.params.productId,
        body: req.body,
        user: (req as any).user
    });
});

/**
 * DELETE /:productId
 * Delete product (admin only)
 */
router.delete('/:productId', authenticateToken, authorizeRoles('admin'), (req, res) => {
    res.json({
        message: `Delete product ${req.params.productId}`,
        productId: req.params.productId,
        user: (req as any).user
    });
});

export default router;