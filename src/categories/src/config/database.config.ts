import { EventEmitter } from "events";
import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export class DatabaseConfig extends EventEmitter {
    private readonly MAX_COUNT = 3;
    private dbConnection: Connection | null = null;
    private mongoConnectionUrl: string = '';

    private buildMongoUri(): string {
        const username = process.env.MONGO_USERNAME || '';
        const password = process.env.MONGO_PASSWORD || '';
        const host = process.env.MONGO_HOST || '127.0.0.1';
        const port = process.env.MONGO_PORT || '27017';
        const authSource = process.env.MONGO_AUTH_SOURCE || 'admin';
        const databaseName = process.env.MONGO_DATABASE_NAME || 'ms_action_categories_db';
        console.log("username", username);
        console.log("password", password);
        if (username && password) {
            return `mongodb://${username}:${password}@${host}:${port}/${databaseName}?authSource=${authSource}`;
        } else {
            return `mongodb://${host}:${port}/${databaseName}`;
        }
    }

    public async connect(retryCount = 1): Promise<void> {
        const options = {
            autoIndex: false,
            maxPoolSize: 10,
            connectTimeoutMS: 2000,
        };
        try {
            this.mongoConnectionUrl = this.buildMongoUri();
            console.log(`Connecting to MongoDB at ${this.mongoConnectionUrl}`);
            await mongoose.connect(this.mongoConnectionUrl, options);
            this.dbConnection = mongoose.connection;
            this.emit("connected", this.dbConnection);
        } catch (error: any) {
            if (error?.code === "ETIMEOUT" && retryCount < this.MAX_COUNT) {
                console.error(`Network error occurred, retrying for ${retryCount} time`, error);
                await new Promise((resolve) => setTimeout(resolve, 5000));
                await this.connect(retryCount + 1);
            } else {
                console.error("Maximum retries reached or non-network error, closing connection", error);
                await this.closeConnection();
                process.exit(1);
            }
        }
    }

    private async closeConnection(): Promise<void> {
        if (this.dbConnection) {
            await this.dbConnection.close();
            this.dbConnection = null;
        }
    }

    public getDbConnection(): Connection | null {
        return this.dbConnection;
    }
}
