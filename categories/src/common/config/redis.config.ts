import { createClient, RedisClientType } from 'redis';
import { Logger } from '../loggers/logger';

export class RedisConfig {
    private client: RedisClientType;
    private logger: Logger;
    private isConnected: boolean = false;

    constructor() {
        this.logger = new Logger();

        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        this.client = createClient({
            url: redisUrl,
            socket: {
                connectTimeout: 60000,
            },
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.client.on('connect', () => {
            this.logger.info('Redis client connected');
        });

        this.client.on('ready', () => {
            this.logger.info('Redis client ready');
            this.isConnected = true;
        });

        this.client.on('error', (err) => {
            this.logger.error(`Redis client error: ${err}`);
            this.isConnected = false;
        });

        this.client.on('end', () => {
            this.logger.info('Redis client disconnected');
            this.isConnected = false;
        });
    }

    async connect(): Promise<void> {
        try {
            if (!this.isConnected) {
                await this.client.connect();
                this.logger.info('Redis connected successfully');
            }
        } catch (error) {
            this.logger.error(`Failed to connect to Redis: ${error}`);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.isConnected) {
                await this.client.disconnect();
                this.logger.info('Redis disconnected successfully');
            }
        } catch (error) {
            this.logger.error(`Failed to disconnect from Redis: ${error}`);
            throw error;
        }
    }

    getClient(): RedisClientType {
        return this.client;
    }

    isClientConnected(): boolean {
        return this.isConnected;
    }
}