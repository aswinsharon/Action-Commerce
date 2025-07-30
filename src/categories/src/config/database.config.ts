import { EventEmitter } from "events";
import mongoose, { Connection } from "mongoose";

const MONGO_URI = 'mongodb://127.0.0.1:27017/ms_action_categories_db';

class DatabaseConfig extends EventEmitter {
    private readonly MAX_COUNT = 3;
    private dbConnection: Connection | null = null;

    connect = async (retryCount = 1): Promise<void> => {
        const options = {
            autoIndex: false,
            maxPoolSize: 10,
            connectTimeoutMS: 2000,
        };
        try {
            await mongoose.connect(MONGO_URI, options);
            this.dbConnection = mongoose.connection;
            this.emit("connected", this.dbConnection);
        } catch (error: any) {
            if (error?.code === "ETIMEOUT" && retryCount <= this.MAX_COUNT) {
                console.error(`Network error occurred, retrying for ${retryCount} time`, error);
                await new Promise((resolve) => setTimeout(resolve, 5000));
                retryCount++;
                await this.connect();
            } else {
                console.error("Maximum retries reached or non-network error, closing connection", error);
                await this.closeConnection();
                process.exit();
            }
        }
    };

    private async closeConnection() {
        if (this.dbConnection) {
            await this.dbConnection.close();
            this.dbConnection = null;
        }
    }

    getDbConnection() {
        return this.dbConnection;
    }
}
export default databaseConfig;
