import express from 'express';
import AuthService from '../services/auth.service';
import { Response } from '../common/dtos/success.response';
import { ErrorResponse } from '../common/dtos/error.response';
import HTTP_STATUS from '../common/constants/httpStatus';
import { Logger } from '../common/loggers/logger';

const logger = new Logger();

class AuthController {
    async register(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const result = await AuthService.register(req.body);

            if (result.code === 'DuplicateValue') {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ErrorResponse(HTTP_STATUS.BAD_REQUEST, result.message!, result.code)
                );
            }

            return res.status(HTTP_STATUS.CREATED).json(new Response(result));
        } catch (error) {
            logger.error(`Registration error: ${error}`);
            return next(error);
        }
    }

    async login(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const result = await AuthService.login(req.body);

            if (result.code === 'InvalidCredentials') {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json(
                    new ErrorResponse(HTTP_STATUS.UNAUTHORIZED, result.message!, result.code)
                );
            }

            return res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            logger.error(`Login error: ${error}`);
            return next(error);
        }
    }

    async verifyToken(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json(
                    new ErrorResponse(HTTP_STATUS.UNAUTHORIZED, 'Token is required', 'MissingToken')
                );
            }

            const result = await AuthService.verifyToken(token);

            if (result.code === 'InvalidToken') {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json(
                    new ErrorResponse(HTTP_STATUS.UNAUTHORIZED, result.message!, result.code)
                );
            }

            return res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            logger.error(`Token verification error: ${error}`);
            return next(error);
        }
    }
}

export const authController = new AuthController();