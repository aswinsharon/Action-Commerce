import express from 'express';
import { authenticateToken, authorizeRoles } from '../common/middlewares/auth.middleware';

const router = express.Router();

/**
 * GET /
 * Get user's cart (authenticated users only)
 */
router.get('/', authenticateToken, (req, res) => {
    res.json({
        message: 'Get user cart',
        user: (req as any).user
    });
});

/**
 * POST /
 * Create new cart (authenticated users only)
 */
router.post('/', authenticateToken, (req, res) => {
    res.json({
        message: 'Create new cart',
        body: req.body,
        user: (req as any).user
    });
});

/**
 * GET /:cartId
 * Get cart by ID (authenticated users only)
 */
router.get('/:cartId', authenticateToken, (req, res) => {
    res.json({
        message: `Get cart ${req.params.cartId}`,
        cartId: req.params.cartId,
        user: (req as any).user
    });
});

/**
 * POST /:cartId/line-items
 * Add item to cart (authenticated users only)
 */
router.post('/:cartId/line-items', authenticateToken, (req, res) => {
    res.json({
        message: `Add item to cart ${req.params.cartId}`,
        cartId: req.params.cartId,
        body: req.body,
        user: (req as any).user
    });
});

/**
 * DELETE /:cartId/line-items/:lineItemId
 * Remove item from cart (authenticated users only)
 */
router.delete('/:cartId/line-items/:lineItemId', authenticateToken, (req, res) => {
    res.json({
        message: `Remove item ${req.params.lineItemId} from cart ${req.params.cartId}`,
        cartId: req.params.cartId,
        lineItemId: req.params.lineItemId,
        user: (req as any).user
    });
});

/**
 * GET /admin/all
 * Get all carts (admin only)
 */
router.get('/admin/all', authenticateToken, authorizeRoles('admin'), (req, res) => {
    res.json({
        message: 'Get all carts (admin)',
        user: (req as any).user
    });
});

export default router;