import { Request, Response, NextFunction } from 'express';
import HTTP_STATUS from '../constants/httpStatus';
import { ErrorResponse } from '../dtos/error.response';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
            new ErrorResponse(
                HTTP_STATUS.UNAUTHORIZED,
                'Access token is missing or invalid',
                'Unauthorized'
            )
        );
    }

    // In a real implementation, verify JWT token here
    // For now, we'll pass through assuming token validation happens at API Gateway
    next();
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

        next();
    };
};
