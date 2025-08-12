import { EventEmitter } from "events";
import mongoose, { Connection } from "mongoose";
import { Logger } from "../loggers/logger";

const logger = new Logger();

export class DatabaseConfig extends EventEmitter {
    private dbConnection: Connection | null = null;
    private mongoConnectionUrl: string = '';
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY_MS = 5000;
    private commandTimes = new Map<number, number>();

    private getMongoConnectUri(): string {
        const {
            MONGO_URI,
        } = process.env || {};
        if (MONGO_URI) return MONGO_URI;
        throw new Error("MONGO_URI is not defined in environment variables.");
    }

    private getConnectionOptions(): mongoose.ConnectOptions {
        const {
            MONGO_USER,
            MONGO_PASSWORD,
            MONGO_DB = 'ms_action_categories_db',
            MONGO_AUTH_SOURCE = 'admin'
        } = process.env;
        const baseOptions: mongoose.ConnectOptions = {
            autoIndex: false,
            maxPoolSize: 10,
            connectTimeoutMS: 2000,
            serverSelectionTimeoutMS: 2000,
            monitorCommands: true,
            dbName: MONGO_DB,
        };
        if (MONGO_USER && MONGO_PASSWORD) {
            return {
                ...baseOptions,
                authSource: MONGO_AUTH_SOURCE,
                auth: { username: MONGO_USER, password: MONGO_PASSWORD }
            };
        }
        return baseOptions;
    }

    public async connect(retryCount = 0): Promise<void> {
        try {
            this.mongoConnectionUrl = this.getMongoConnectUri();
            logger.info(`Connecting to MongoDB at ${this.mongoConnectionUrl}`);
            const options = this.getConnectionOptions();
            await mongoose.connect(this.mongoConnectionUrl, options);
            this.dbConnection = mongoose.connection;
            this.setupEventListeners();
            this.emit("connected", this.dbConnection);
        } catch (error: any) {
            logger.error(`MongoDB connection error: ${error.message}`);
            if (retryCount < this.MAX_RETRIES) {
                logger.warn(`Retrying MongoDB connection (${retryCount + 1}/${this.MAX_RETRIES}) in ${this.RETRY_DELAY_MS / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
                await this.connect(retryCount + 1);
            } else {
                logger.error('Max MongoDB connection retries reached. Exiting.');
                await this.closeConnection();
                process.exit(1);
            }
        }
    }

    private setupEventListeners() {
        if (!this.dbConnection) return;
        this.dbConnection.removeAllListeners("commandStarted");
        this.dbConnection.removeAllListeners("commandSucceeded");
        this.dbConnection.removeAllListeners("commandFailed");

        this.dbConnection.on("commandStarted", (event: any) => {
            this.commandTimes.set(event.requestId, Date.now());
        });
        this.dbConnection.on("commandSucceeded", (event: any) => {
            const start = this.commandTimes.get(event.requestId);
            if (start) {
                const duration = Date.now() - start;
                logger.debug(`[MongoDB] ${event.commandName} took ${duration} ms`);
                this.commandTimes.delete(event.requestId);
            }
        });
        this.dbConnection.on("commandFailed", (event: any) => {
            const start = this.commandTimes.get(event.requestId);
            if (start) {
                const duration = Date.now() - start;
                logger.debug(`[MongoDB] ${event.commandName} failed after ${duration} ms`);
                this.commandTimes.delete(event.requestId);
            }
        });
    }

    public async closeConnection(): Promise<void> {
        if (this.dbConnection) {
            await this.dbConnection.close();
            this.dbConnection = null;
        }
    }

    public getDbConnection(): Connection | null {
        return this.dbConnection;
    }
}
