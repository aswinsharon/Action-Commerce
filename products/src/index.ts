import express from 'express';
import cors from 'cors';
import serverless from "serverless-http";
import dotenv from 'dotenv';
import productRoutes from './routes/product.route';
import { DatabaseConfig } from './common/config/database.config';
import { errorHandler } from './common/middlewares/errorHandler';
import { Logger } from './common/loggers/logger';

dotenv.config();
const app = express();
const dataBaseConfig = new DatabaseConfig();
const logger = new Logger();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(errorHandler);

app.use('/products', productRoutes);

dataBaseConfig.on("connected", () => {
    logger.info("MongoDB connected successfully!");
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 6002;

const startServer = async () => {
    try {
        await dataBaseConfig.connect();
        app.listen(PORT, () => {
            logger.info(`Products Service is running on port ${PORT}`);
        });
    } catch (err) {
        logger.error(`Failed to start server: ${err}`);
        process.exit(1);
    }
};

const gracefulShutdown = async () => {
    logger.info("Shutting down server and closing MongoDB connection...");
    try {
        await dataBaseConfig.closeConnection();
    } catch (err) {
        logger.error(`Error during MongoDB shutdown: ${err}`);
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