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

dotenv.config();
const app = express();
const dataBaseConfig = new DatabaseConfig();
const logger = new Logger();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Error handler should be placed AFTER routes
app.use(errorHandler);

dataBaseConfig.on("connected", async (sequelize) => {
    logger.info("PostgreSQL connected successfully!");
    // Initialize User model with Sequelize instance
    initUserModel(sequelize);
    logger.info("User model initialized successfully!");

    // Sync database (create tables if they don't exist)
    try {
        await sequelize.sync({ alter: true });
        logger.info("Database synchronized successfully!");
    } catch (error) {
        logger.error(`Database sync error: ${error}`);
    }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 6001;

const startServer = async () => {
    try {
        await dataBaseConfig.connect();
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

(async () => {
    await startServer();
})();

if (process.env.SERVERLESS) {
    exports.handler = serverless(app);
}