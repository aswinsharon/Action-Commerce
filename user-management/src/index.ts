import express from 'express';
import cors from 'cors';
import serverless from "serverless-http";
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import { DatabaseConfig } from './common/config/database.config';
import { errorHandler } from './common/middlewares/errorHandler';
import { Logger } from './common/loggers/logger';
import { initUserModel } from './models/user.model';
import { initializeCache, shutdownCache } from './common/middlewares/cache.middleware';

dotenv.config();
const app = express();
const dataBaseConfig = new DatabaseConfig();
const logger = new Logger();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Debug middleware to log all requests
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - Content-Type: ${req.headers['content-type']}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        serverless: process.env.SERVERLESS === 'true'
    });
});

// Test endpoint for debugging request body parsing
app.post('/test', (req, res) => {
    logger.info(`Test endpoint - Body: ${JSON.stringify(req.body)}`);
    logger.info(`Test endpoint - Headers: ${JSON.stringify(req.headers)}`);
    res.json({
        receivedBody: req.body,
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body || {}),
        headers: req.headers
    });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Error handler should be placed AFTER routes
app.use(errorHandler);

const PORT = process.env.PORT ? Number(process.env.PORT) : 6001;

const initializeDatabase = async () => {
    try {
        await dataBaseConfig.connect();
        await initUserModel();
        await dataBaseConfig.syncDatabase();
        logger.info('Database initialized successfully');
    } catch (error) {
        logger.error(`Database initialization failed: ${error}`);
        throw error;
    }
};

const startServer = async () => {
    try {
        await initializeDatabase();
        await initializeCache();

        if (process.env.SERVERLESS !== 'true') {
            app.listen(PORT, () => {
                logger.info(`User Management service running on port ${PORT}`);
            });
        }
    } catch (err) {
        logger.error(`Failed to start server: ${err}`);
        process.exit(1);
    }
};

const gracefulShutdown = async () => {
    logger.info("Shutting down server and closing connections...");
    try {
        await shutdownCache();
        await dataBaseConfig.closeConnection();
    } catch (err) {
        logger.error(`Error during shutdown: ${err}`);
    }
    process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

(async () => {
    await startServer();
})();

if (process.env.SERVERLESS) {
    exports.handler = serverless(app);
}
return new Promise<void>((resolve, reject) => {
    dataBaseConfig.on("connected", async (sequelize) => {
        try {
            logger.info("PostgreSQL connected successfully!");
            // Initialize User model with Sequelize instance
            initUserModel(sequelize);
            logger.info("User model initialized successfully!");

            // Sync database (create tables if they don't exist)
            await sequelize.sync({ alter: true });
            logger.info("Database synchronized successfully!");
            resolve();
        } catch (error) {
            logger.error(`Database sync error: ${error}`);
            reject(error);
        }
    });

    dataBaseConfig.connect().catch(reject);
});
};

const startServer = async () => {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            logger.info(`User Management Service is running on port ${PORT}`);
        });
    } catch (err) {
        logger.error(`Failed to start server: ${err}`);
        process.exit(1);
    }
};

const gracefulShutdown = async () => {
    logger.info("Shutting down server and closing PostgreSQL connection...");
    try {
        await dataBaseConfig.closeConnection();
    } catch (err) {
        logger.error(`Error during PostgreSQL shutdown: ${err}`);
    }
    process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Initialize for serverless or regular server
if (process.env.SERVERLESS === 'true') {
    let isInitialized = false;
    let initPromise: Promise<void> | null = null;

    const ensureInitialized = async () => {
        if (!isInitialized && !initPromise) {
            initPromise = initializeDatabase().then(() => {
                isInitialized = true;
            });
        }
        if (initPromise) {
            await initPromise;
        }
    };

    // Wrap the serverless handler to ensure database is initialized
    const originalHandler = serverless(app, {
        binary: false,
        request: (request: any, event: any, context: any) => {
            // Ensure proper body parsing for API Gateway events
            if (event.body && typeof event.body === 'string') {
                try {
                    request.body = JSON.parse(event.body);
                } catch (e) {
                    logger.warn(`Failed to parse request body: ${e}`);
                }
            }
        }
    });

    exports.handler = async (event: any, context: any) => {
        try {
            logger.info(`Serverless event: ${JSON.stringify(event)}`);
            await ensureInitialized();
            return originalHandler(event, context);
        } catch (error) {
            logger.error(`Serverless handler initialization error: ${error}`);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    error: 'Internal Server Error',
                    message: 'Database initialization failed'
                })
            };
        }
    };
} else {
    (async () => {
        await startServer();
    })();
}