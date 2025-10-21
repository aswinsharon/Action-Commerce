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

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json(
            new ErrorResponse(401, 'Access token is required', 'Unauthorized')
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        req.user = decoded;
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