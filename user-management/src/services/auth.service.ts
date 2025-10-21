import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import HTTP_STATUS from '../common/constants/httpStatus';

interface ServiceResponse<T> {
    status: number;
    code: string;
    message?: string;
    data?: T;
}

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'admin' | 'customer' | 'manager';
}

interface AuthResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    };
    token: string;
}

class AuthService {
    static async register(data: RegisterData): Promise<ServiceResponse<AuthResponse | null>> {
        try {
            const existingUser = await User.findOne({ where: { email: data.email } });
            if (existingUser) {
                return {
                    status: HTTP_STATUS.BAD_REQUEST,
                    code: 'DuplicateValue',
                    message: 'User with this email already exists',
                    data: null
                };
            }

            const hashedPassword = await bcrypt.hash(data.password, 12);
            const user = await User.create({
                ...data,
                password: hashedPassword,
                role: data.role || 'customer'
            });

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET!,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            return {
                status: HTTP_STATUS.CREATED,
                code: 'Success',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role
                    },
                    token
                }
            };
        } catch (error: any) {
            return {
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                code: 'InternalServerError',
                message: error.message,
                data: null
            };
        }
    }

    static async login(data: LoginData): Promise<ServiceResponse<AuthResponse | null>> {
        try {
            const user = await User.findOne({ where: { email: data.email, isActive: true } });
            if (!user) {
                return {
                    status: HTTP_STATUS.UNAUTHORIZED,
                    code: 'InvalidCredentials',
                    message: 'Invalid email or password',
                    data: null
                };
            }

            const isPasswordValid = await bcrypt.compare(data.password, user.password);
            if (!isPasswordValid) {
                return {
                    status: HTTP_STATUS.UNAUTHORIZED,
                    code: 'InvalidCredentials',
                    message: 'Invalid email or password',
                    data: null
                };
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET!,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            return {
                status: HTTP_STATUS.OK,
                code: 'Success',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role
                    },
                    token
                }
            };
        } catch (error: any) {
            return {
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                code: 'InternalServerError',
                message: error.message,
                data: null
            };
        }
    }

    static async verifyToken(token: string): Promise<ServiceResponse<any>> {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            const user = await User.findByPk(decoded.id);

            if (!user || !user.isActive) {
                return {
                    status: HTTP_STATUS.UNAUTHORIZED,
                    code: 'InvalidToken',
                    message: 'Invalid or expired token',
                    data: null
                };
            }

            return {
                status: HTTP_STATUS.OK,
                code: 'Success',
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error: any) {
            return {
                status: HTTP_STATUS.UNAUTHORIZED,
                code: 'InvalidToken',
                message: 'Invalid or expired token',
                data: null
            };
        }
    }
}

export default AuthService;