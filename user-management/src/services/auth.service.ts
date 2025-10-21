import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserCreationAttributes } from '../models/user.model';
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

interface RegisterData extends UserCreationAttributes { }

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
    private static getJwtSecret(): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not defined');
        }
        return secret;
    }

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
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || 'customer',
                isActive: true
            });

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                this.getJwtSecret(),
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
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
            console.error('Registration error:', error);
            return {
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                code: 'InternalServerError',
                message: process.env.NODE_ENV === 'production'
                    ? 'Registration failed'
                    : error.message,
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
                this.getJwtSecret(),
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
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
            console.error('Login error:', error);
            return {
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                code: 'InternalServerError',
                message: process.env.NODE_ENV === 'production'
                    ? 'Login failed'
                    : error.message,
                data: null
            };
        }
    }

    static async verifyToken(token: string): Promise<ServiceResponse<any>> {
        try {
            const decoded = jwt.verify(token, this.getJwtSecret()) as any;
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