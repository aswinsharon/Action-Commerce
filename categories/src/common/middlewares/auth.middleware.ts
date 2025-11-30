import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../dtos/error.response';
import { Logger } from '../loggers/logger';

const logger = new Logger();

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
    clientId?: string;
}

/**
 * Authentication middleware that trusts the API Gateway
 * The gateway validates JWT tokens and forwards user info via headers
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    logger.info(`Auth middleware called for ${req.method} ${req.path}`);

    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const clientId = req.headers['x-client-id'] as string;

    logger.info(`User headers - ID: ${userId ? 'Present' : 'Missing'}, Email: ${userEmail ? 'Present' : 'Missing'}, Role: ${userRole ? 'Present' : 'Missing'}`);
    logger.info(`Client ID header: ${clientId ? 'Present' : 'Missing'}`);

    if (!clientId) {
        logger.warn('No client ID provided');
        return res.status(400).json(
            new ErrorResponse(400, 'x-client-id header is required', 'MissingClientId')
        );
    }

    if (!userId || !userEmail || !userRole) {
        logger.warn('User not authenticated - missing user headers from gateway');
        return res.status(401).json(
            new ErrorResponse(401, 'User not authenticated', 'Unauthorized')
        );
    }

    // Populate req.user from gateway headers
    req.user = {
        id: userId,
        email: userEmail,
        role: userRole
    };
    req.clientId = clientId;

    logger.info(`User authenticated: ${userEmail} (${userRole}) with clientId: ${clientId}`);
    return next();
};

export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json(
                new ErrorResponse(401, 'Authentication required', 'Unauthorized')
            );
        }

        if (!roles.includes(req.user.role)) {
            logger.warn(`User ${req.user.email} with role ${req.user.role} tried to access endpoint requiring roles: ${roles.join(', ')}`);
            return res.status(403).json(
                new ErrorResponse(403, 'Insufficient permissions', 'Forbidden')
            );
        }

        return next();
    };
};