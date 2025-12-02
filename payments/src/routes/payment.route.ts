/**
 * @fileoverview Express router for handling payment-related API endpoints.
 * 
 * 
 * 
 */

import express from "express";
import { paymentController } from "../controllers/payment.controller";
import { validateBody } from "../common/middlewares/validateBody";
import { createPaymentValidationSchema } from "../common/validations/payment.validation";
import { authenticateToken, authorizeRoles } from "../common/middlewares/auth.middleware";
const router = express.Router();

/**
 * Commerce Tools Payment Endpoints
 * Base path: /{projectKey}/payments
 */

/**
 * Query Payments
 * GET /{projectKey}/payments
 * Query and filter payments with pagination, sorting, and filtering
 */
router.get('/', authenticateToken, paymentController.getAllPayments);

/**
 * Get Payment by Key
 * GET /{projectKey}/payments/key={key}
 * Retrieve a single payment by its key
 */
router.get('/key=:key', authenticateToken, paymentController.getPaymentByKey);

/**
 * Get Payment by ID
 * GET /{projectKey}/payments/{id}
 * Retrieve a single payment by its ID
 */
router.get('/:id', authenticateToken, paymentController.getPaymentById);

/**
 * Create Payment
 * POST /{projectKey}/payments
 * Create a new payment
 */
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), validateBody(createPaymentValidationSchema), paymentController.createPayment);

/**
 * Update Payment by Key
 * POST /{projectKey}/payments/key={key}
 * Update a payment by key using update actions
 */
router.post('/key=:key', authenticateToken, authorizeRoles('admin', 'manager'), paymentController.updatePaymentByKey);

/**
 * Update Payment by ID
 * POST /{projectKey}/payments/{id}
 * Update a payment using update actions
 */
router.post('/:id', authenticateToken, authorizeRoles('admin', 'manager'), paymentController.updatePaymentById);

/**
 * Delete Payment by Key
 * DELETE /{projectKey}/payments/key={key}?version={version}
 * Delete a payment by key with version for optimistic concurrency control
 */
router.delete('/key=:key', authenticateToken, authorizeRoles('admin'), paymentController.deletePaymentByKey);

/**
 * Delete Payment by ID
 * DELETE /{projectKey}/payments/{id}?version={version}
 * Delete a payment by ID with version for optimistic concurrency control
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), paymentController.deletePaymentById);

/**
 * Check if Payment exists by ID
 * HEAD /{projectKey}/payments/{id}
 */
router.head('/:id', authenticateToken, paymentController.checkPaymentExistsById);

/**
 * Check if Payments exist
 * HEAD /{projectKey}/payments
 */
router.head('/', authenticateToken, paymentController.checkPaymentsExist);

export default router;
