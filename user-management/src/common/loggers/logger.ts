import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import chalk from 'chalk';

export type LogLevel = 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';

export class Logger extends EventEmitter {
    private logFilePath: string;
    private configuredLogLevel: LogLevel;
    private canWriteToFile: boolean = true;
    private levelPriority: Record<LogLevel, number> = {
        'DEBUG': 1,
        'INFO': 2,
        'WARN': 3,
        'ERROR': 4
    };

    constructor() {
        super();
        this.configuredLogLevel = (process.env.LOG_LEVEL as LogLevel) || 'INFO';
        const logFileName = `log-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;

        const isServerless = process.env.SERVERLESS === 'true';
        const logDir = isServerless
            ? '/tmp'
            : path.resolve(process.cwd(), 'src', 'logs');

        try {
            if (!isServerless && !fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            this.logFilePath = `${logDir}/${logFileName}`;

            fs.appendFileSync(this.logFilePath, '');
        } catch (error) {
            console.warn(`Cannot write to log file: ${error}. Falling back to console-only logging.`);
            this.canWriteToFile = false;
            this.logFilePath = '';
        }
    }

    private getColor(level: LogLevel) {
        switch (level) {
            case 'INFO': return chalk.blue;
            case 'ERROR': return chalk.red;
            case 'WARN': return chalk.yellow;
            case 'DEBUG': return chalk.green;
            default: return chalk.white;
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return this.levelPriority[level] >= this.levelPriority[this.configuredLogLevel];
    }

    public log(message: string, level: LogLevel = "INFO"): void {
        if (!this.shouldLog(level)) return;

        const timestamp = new Date().toISOString();
        const memoryUsage = process.memoryUsage();
        const usedMemoryMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);

        const color = this.getColor(level);
        const coloredLevel = color(`[${level}]`);

        const logMessage = `[${timestamp}] [${level}] [Memory: ${usedMemoryMB} MB] ${message}\n`;

        // Only write to file if we can
        if (this.canWriteToFile && this.logFilePath) {
            try {
                fs.appendFileSync(this.logFilePath, logMessage);
            } catch (error) {
                console.warn(`Failed to write to log file: ${error}`);
                this.canWriteToFile = false;
            }
        }

        const consoleMessage = `[${timestamp}] ${coloredLevel} [Memory: ${usedMemoryMB} MB] ${message}`;
        console.log(consoleMessage);

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