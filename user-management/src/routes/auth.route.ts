import express from 'express';
import { authController } from '../controllers/auth.controller';

const router = express.Router();

/**
 * POST /register
 * Register a new user
 */
router.post('/register', authController.register);

/**
 * POST /login
 * Authenticate user and return JWT token
 */
router.post('/login', authController.login);

/**
 * POST /verify
 * Verify JWT token validity
 */
router.post('/verify', authController.verifyToken);

export default router;