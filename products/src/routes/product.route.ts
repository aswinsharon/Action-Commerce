/**
 * @fileoverview Express router for handling product-related API endpoints.
 * Commerce Tools compatible Product API endpoints.
 * 
 * 
 */

import express from "express";
import { productController } from "../controllers/product.controller";
import { validateBody } from "../common/middlewares/validateBody";
import { createProductValidationSchema } from "../common/validations/product.validation";
import { authenticateToken, authorizeRoles } from "../common/middlewares/auth.middleware";
const router = express.Router();

/**
 * Commerce Tools Product Endpoints
 * Base path: /{projectKey}/products
 */

/**
 * Query Products
 * GET /{projectKey}/products
 */
router.get('/', authenticateToken, productController.getAllProducts);

/**
 * Get Product by Key
 * GET /{projectKey}/products/key={key}
 */
router.get('/key=:key', authenticateToken, productController.getProductByKey);

/**
 * Get Product by ID
 * GET /{projectKey}/products/{id}
 */
router.get('/:id', authenticateToken, productController.getProductById);

/**
 * Create Product
 * POST /{projectKey}/products
 */
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), validateBody(createProductValidationSchema), productController.createProduct);

/**
 * Update Product by Key
 * POST /{projectKey}/products/key={key}
 */
router.post('/key=:key', authenticateToken, authorizeRoles('admin', 'manager'), productController.updateProductByKey);

/**
 * Update Product by ID
 * POST /{projectKey}/products/{id}
 */
router.post('/:id', authenticateToken, authorizeRoles('admin', 'manager'), productController.updateProductById);

/**
 * Delete Product by Key
 * DELETE /{projectKey}/products/key={key}?version={version}
 */
router.delete('/key=:key', authenticateToken, authorizeRoles('admin'), productController.deleteProductByKey);

/**
 * Delete Product by ID
 * DELETE /{projectKey}/products/{id}?version={version}
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), productController.deleteProductById);

/**
 * Check if Product exists by ID
 * HEAD /{projectKey}/products/{id}
 */
router.head('/:id', authenticateToken, productController.checkProductExistsById);

/**
 * Check if Products exist
 * HEAD /{projectKey}/products
 */
router.head('/', authenticateToken, productController.checkProductsExist);

/**
 * OPTIMIZED ENDPOINTS
 */

/**
 * Get Product by SKU (Optimized with index)
 * GET /{projectKey}/products/sku/{sku}
 */
router.get('/sku/:sku', authenticateToken, productController.getProductBySku);

/**
 * Get Products by Price Range (Optimized with aggregation)
 * GET /{projectKey}/products/price-range?minPrice={min}&maxPrice={max}&currencyCode={code}
 */
router.get('/price-range', authenticateToken, productController.getProductsByPriceRange);

/**
 * Get Products by Category (Optimized with projection)
 * GET /{projectKey}/products/category/{categoryId}
 */
router.get('/category/:categoryId', authenticateToken, productController.getProductsByCategory);

/**
 * Update Variant Stock (Atomic operation)
 * PATCH /{projectKey}/products/{id}/variants/{sku}/stock
 */
router.patch('/:id/variants/:sku/stock', authenticateToken, authorizeRoles('admin', 'manager'), productController.updateVariantStock);

export default router;
