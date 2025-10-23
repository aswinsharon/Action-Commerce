import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErrorResponse } from '../dtos/error.response';
import { Logger } from '../loggers/logger';

const logger = new Logger();

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    console.log('Auth middleware - JWT_SECRET loaded:', secret ? 'Yes' : 'No');
    console.log('Auth middleware - JWT_SECRET value:', secret);
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }
    return secret;
};

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    logger.info(`Auth middleware called for ${req.method} ${req.path}`);

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
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        req.user = decoded;
        logger.info(`Token verified successfully for user: ${decoded.email}`);
        return next();
    } catch (error) {
        logger.error(`Token verification failed: ${error}`);
        return res.status(403).json(
            new ErrorResponse(403, 'Invalid or expired token', 'Forbidden')
        );
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
            return res.status(403).json(
                new ErrorResponse(403, 'Insufficient permissions', 'Forbidden')
            );
        }
        return next();
    };
};