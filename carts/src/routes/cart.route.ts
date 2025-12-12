/**
 * @fileoverview Express router for handling cart-related API endpoints.
 *
 * 
 * 
 */

import express from "express";
import { cartController } from "../controllers/cart.controller";
import { validateBody } from "../common/middlewares/validateBody";
import { createCartValidationSchema } from "../common/validations/cart.validation";
import { authenticateToken, authorizeRoles } from "../common/middlewares/auth.middleware";
import { cacheMiddleware } from "../common/middlewares/cache.middleware";
const router = express.Router();

/**
 * Query Carts
 * GET /{projectKey}/carts
 */
router.get('/',
    authenticateToken,
    cacheMiddleware.cache({
        ttl: 300, // 5 minutes
        keyGenerator: cacheMiddleware.generateCartKey
    }),
    cartController.getAllCarts
);

/**
 * Get Cart by Customer ID
 * GET /{projectKey}/carts/customer-id={customerId}
 */
router.get('/customer-id=:customerId',
    authenticateToken,
    cacheMiddleware.cache({
        ttl: 900, // 15 minutes
        keyGenerator: cacheMiddleware.generateCartKey
    }),
    cartController.getCartByCustomerId
);

/**
 * Get Cart by Key
 * GET /{projectKey}/carts/key={key}
 */
router.get('/key=:key',
    authenticateToken,
    cacheMiddleware.cache({
        ttl: 1800, // 30 minutes
        keyGenerator: cacheMiddleware.generateCartKey
    }),
    cartController.getCartByKey
);

/**
 * Get Cart by ID
 * GET /{projectKey}/carts/{id}
 */
router.get('/:id',
    authenticateToken,
    cacheMiddleware.cache({
        ttl: 1800, // 30 minutes
        keyGenerator: cacheMiddleware.generateCartKey
    }),
    cartController.getCartById
);

/**
 * Create Cart
 * POST /{projectKey}/carts
 */
router.post('/',
    authenticateToken,
    validateBody(createCartValidationSchema),
    cacheMiddleware.invalidateCache(['cart:*', 'carts:*']),
    cartController.createCart
);

/**
 * Update Cart by Key
 * POST /{projectKey}/carts/key={key}
 */
router.post('/key=:key',
    authenticateToken,
    cacheMiddleware.invalidateCache(cacheMiddleware.generateCartInvalidationPatterns),
    cartController.updateCartByKey
);

/**
 * Update Cart by ID
 * POST /{projectKey}/carts/{id}
 */
router.post('/:id',
    authenticateToken,
    cacheMiddleware.invalidateCache(cacheMiddleware.generateCartInvalidationPatterns),
    cartController.updateCartById
);

/**
 * Delete Cart by Key
 * DELETE /{projectKey}/carts/key={key}?version={version}
 */
router.delete('/key=:key',
    authenticateToken,
    authorizeRoles('admin'),
    cacheMiddleware.invalidateCache(cacheMiddleware.generateCartInvalidationPatterns),
    cartController.deleteCartByKey
);

/**
 * Delete Cart by ID
 * DELETE /{projectKey}/carts/{id}?version={version}
 */
router.delete('/:id',
    authenticateToken,
    authorizeRoles('admin'),
    cacheMiddleware.invalidateCache(cacheMiddleware.generateCartInvalidationPatterns),
    cartController.deleteCartById
);

/**
 * Check if Cart exists by ID
 * HEAD /{projectKey}/carts/{id}
 */
router.head('/:id', authenticateToken, cartController.checkCartExistsById);

/**
 * Check if Carts exist
 * HEAD /{projectKey}/carts
 */
router.head('/', authenticateToken, cartController.checkCartsExist);

export default router;
