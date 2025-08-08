import { EventEmitter } from "events";
import mongoose, { Connection } from "mongoose";
import { Logger } from "../loggers/logger";

const logger = new Logger();

export class DatabaseConfig extends EventEmitter {
    private dbConnection: Connection | null = null;
    private mongoConnectionUrl: string = '';

    private buildMongoUri(): string {
        if (process.env.MONGO_URI) {
            return process.env.MONGO_URI + `/${process.env.MONGO_DATABASE_NAME || 'ms_action_categories_db'}`;
        } else {
            throw new Error("MONGO_URI is not defined in the environment variables.");
        }
    }

    public async connect(): Promise<void> {
        const options = {
            autoIndex: false,
            maxPoolSize: 10,
            connectTimeoutMS: 2000,
        };
        try {
            this.mongoConnectionUrl = this.buildMongoUri();
            logger.info(`Connecting to MongoDB at ${this.mongoConnectionUrl}`);
            await mongoose.connect(this.mongoConnectionUrl, options);
            this.dbConnection = mongoose.connection;
            this.emit("connected", this.dbConnection);
        } catch (error: any) {
            logger.error(JSON.stringify(error));
            await this.closeConnection();
            process.exit(1);
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
