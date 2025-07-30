import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import route from './routes/category.route';
import DatabaseConfig from './config/database.config';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const dataBaseConfig = new DatabaseConfig();
dotenv.config();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/categories', route);
app.use(errorHandler);

dataBaseConfig.on("connected", () => {
    console.log("Event received: MongoDB connected successfully!");
});

const startServer = async () => {
    await dataBaseConfig.connect();
    app.listen(6003, () => {
        console.log(`Server is running on port ${6003}`);
    });
};

process.on("SIGINT", async () => {
    console.log("\nClosing MongoDB connection...");
    const dbConnection = dataBaseConfig.getDbConnection();
    if (dbConnection) {
        await dbConnection.close();
    }
    process.exit();
});

(async () => {
    await startServer();
})();