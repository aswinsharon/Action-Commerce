import { EventEmitter } from "events";
import { Sequelize } from "sequelize";
import { Logger } from "../loggers/logger";

const logger = new Logger();

export class DatabaseConfig extends EventEmitter {
    private sequelize: Sequelize | null = null;
    private readonly MAX_RECONNECTION_ATTEMPTS = 5;
    private readonly RECONNECTION_DELAY_MS = 5000;

    public isHealthy(): boolean {
        return !!(this.sequelize && this.sequelize.authenticate);
    }

    private getConnectionConfig() {
        const {
            POSTGRES_HOST = 'localhost',
            POSTGRES_PORT = '5432',
            POSTGRES_DB = 'ms_action_users_db',
            POSTGRES_USER = 'postgres',
            POSTGRES_PASSWORD = 'password'
        } = process.env;

        return {
            host: POSTGRES_HOST,
            port: parseInt(POSTGRES_PORT, 10),
            database: POSTGRES_DB,
            username: POSTGRES_USER,
            password: POSTGRES_PASSWORD,
            dialect: 'postgres' as const,
            logging: (msg: string) => logger.debug(`[PostgreSQL] ${msg}`),
            ...(process.env.NODE_ENV === 'dev' && {
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                }
            }),
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        };
    }

    public async connect(retryCount = 0): Promise<void> {
        try {
            const config = this.getConnectionConfig();
            logger.info(`Connecting to PostgreSQL at ${config.host}:${config.port}/${config.database}`);

            this.sequelize = new Sequelize(config);
            await this.sequelize.authenticate();

            logger.info('PostgreSQL connected successfully!');
            this.emit("connected", this.sequelize);
        } catch (error: any) {
            logger.error(`PostgreSQL connection error: ${error.message}`);
            if (retryCount < this.MAX_RECONNECTION_ATTEMPTS) {
                logger.warn(`Retrying PostgreSQL connection (${retryCount + 1}/${this.MAX_RECONNECTION_ATTEMPTS}) in ${this.RECONNECTION_DELAY_MS / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, this.RECONNECTION_DELAY_MS));
                await this.connect(retryCount + 1);
            } else {
                logger.error('Max PostgreSQL connection retries reached. Exiting.');
                await this.closeConnection();
                process.exit(1);
            }
        }
    }

    public async closeConnection(): Promise<void> {
        if (this.sequelize) {
            await this.sequelize.close();
            this.sequelize = null;
        }
    }

    public getDbConnection(): Sequelize | null {
        return this.sequelize;
    }
}