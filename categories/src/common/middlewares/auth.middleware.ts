import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
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

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    logger.info(`Auth middleware called for ${req.method} ${req.path}`);

    // Check for clientId header (like commercetools)
    const clientId = req.headers['x-client-id'] as string;
    logger.info(`Client ID header: ${clientId ? 'Present' : 'Missing'}`);

    if (!clientId) {
        logger.warn('No client ID provided');
        return res.status(400).json(
            new ErrorResponse(400, 'x-client-id header is required', 'MissingClientId')
        );
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    logger.info(`Authorization header: ${authHeader ? 'Present' : 'Missing'}`);
    logger.info(`Token extracted: ${token ? 'Present' : 'Missing'}`);

    if (!token) {
        logger.warn('No token provided');
        return res.status(401).json(
            new ErrorResponse(401, 'Access token is required', 'Unauthorized')
        );
    }

    try {
        const userManagementUrl = process.env.USER_MANAGEMENT_URL || 'http://localhost:6001';
        logger.info(`Verifying token with user management service: ${userManagementUrl}`);

        const response = await axios.post(`${userManagementUrl}/auth/verify`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-client-id': clientId
            }
        });

        req.user = response.data.data;
        req.clientId = clientId;
        logger.info(`Token verified successfully for user: ${req.user?.email} with clientId: ${clientId}`);
        return next();
    } catch (error: any) {
        logger.error(`Token verification failed: ${error.message}`);
        logger.error(`Full error details: I` + error.response?.data || error);

        // Check if it's a network/connection error
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            logger.error('Cannot connect to user management service');
            return res.status(503).json({
                statusCode: 503,
                message: 'User management service unavailable',
                errors: [{
                    code: 'ServiceUnavailable',
                    message: 'Cannot connect to authentication service'
                }]
            });
        }

        // Return the actual error from user management service if available
        if (error.response && error.response.data) {
            logger.error(`Received error from user management service: ` + error.response.data);
            return res.status(error.response.status || 403).json(error.response.data);
        }

        return res.status(403).json({
            statusCode: 403,
            message: 'Invalid or expired token',
            errors: [{
                code: 'Forbidden',
                message: 'Invalid or expired token'
            }]
        });
    }
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