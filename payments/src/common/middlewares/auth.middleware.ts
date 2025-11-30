import { Request, Response, NextFunction } from 'express';
import HTTP_STATUS from '../constants/httpStatus';
import { ErrorResponse } from '../dtos/error.response';

/**
 * Authentication middleware that trusts the API Gateway
 * The gateway validates JWT tokens and forwards user info via headers
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (!userId || !userEmail || !userRole) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
            new ErrorResponse(
                HTTP_STATUS.UNAUTHORIZED,
                'User not authenticated',
                'Unauthorized'
            )
        );
    }

    // Populate req.user from gateway headers
    req.user = {
        id: userId,
        email: userEmail,
        role: userRole
    };

    return next();
};

export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json(
                new ErrorResponse(
                    HTTP_STATUS.UNAUTHORIZED,
                    'User not authenticated',
                    'Unauthorized'
                )
            );
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json(
                new ErrorResponse(
                    HTTP_STATUS.FORBIDDEN,
                    'You do not have permission to perform this action',
                    'Forbidden'
                )
            );
        }

        return next();
    };
};
