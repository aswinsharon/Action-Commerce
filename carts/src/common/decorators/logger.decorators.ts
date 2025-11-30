import { Logger, LogLevel } from '../loggers/logger';

const logger = new Logger();

export function LogMethod(level: LogLevel = 'INFO') {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const className = target.constructor.name;
            logger.log(`[${className}.${propertyKey}] Method called`, level);

            try {
                const result = await originalMethod.apply(this, args);
                logger.log(`[${className}.${propertyKey}] Method completed`, level);
                return result;
            } catch (error) {
                logger.error(`[${className}.${propertyKey}] Method failed: ${error}`);
                throw error;
            }
        };

        return descriptor;
    };
}
