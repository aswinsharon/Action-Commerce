import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

export type LogLevel = 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';

export class Logger extends EventEmitter {
    private logFilePath: string;

    constructor(logFileName: string = 'app.log') {
        super();
        const logDir = path.resolve(__dirname, '..', 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        this.logFilePath = `${logDir}/${logFileName}`;
        console.log(`Logger initialized. Logs will be saved to: ${this.logFilePath}`);
    }

    public log(message: string, level: LogLevel = "INFO"): void {
        const timestamp = new Date().toISOString();
        const memoryUsage = process.memoryUsage();
        const usedMemoryMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);
        const logMessage = `[${timestamp}] [${level}] [Memory: ${usedMemoryMB} MB] ${message}\n`;
        fs.appendFileSync(this.logFilePath, logMessage);
        console.log(logMessage.trim());
        this.emit('logged', logMessage);
    }

    public info(msg: string): void {
        this.log(msg, 'INFO');
    }

    public error(msg: string): void {
        this.log(msg, 'ERROR');
    }

    public warn(msg: string): void {
        this.log(msg, 'WARN');
    }

    public debug(msg: string): void {
        this.log(msg, 'DEBUG');
    }


    public getLogFilePath(): string {
        return this.logFilePath;
    }
}