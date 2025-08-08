import express from 'express';
import cors from 'cors';
import serverless from "serverless-http";
import dotenv from 'dotenv';
import route from './routes/category.route';
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
app.use('/categories', route);
app.use(errorHandler);

dataBaseConfig.on("connected", () => {
    logger.info("Event received: MongoDB connected successfully!");
});

const startServer = async () => {
    await dataBaseConfig.connect();
    app.listen(6003, () => {
        logger.info(`Server is running on port ${6003}`);
    });
};

process.on("SIGINT", async () => {
    logger.info("Closing MongoDB connection...");
    const dbConnection = dataBaseConfig.getDbConnection();
    if (dbConnection) {
        await dbConnection.close();
    }
    process.exit();
});

(async () => {
    await startServer();
})();

exports.handler = serverless(app);
