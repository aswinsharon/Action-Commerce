// log.decorator.ts
import { Logger, LogLevel } from '../loggers/logger';

const logger = new Logger(); // Optional: pass filename if needed

export function LogMethod(level: LogLevel = 'INFO') {
    return function (
        target: any,
        propertyName: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            logger.log(`Called ${propertyName} with args: ${JSON.stringify(args)}`, level);

            try {
                const result = originalMethod.apply(this, args);

                if (result instanceof Promise) {
                    return result
                        .then(res => {
                            logger.log(`Returned from ${propertyName}: ${JSON.stringify(res)}`, level);
                            return res;
                        })
                        .catch(err => {
                            logger.error(`Error in ${propertyName}: ${err.stack || err}`);
                            throw err;
                        });
                } else {
                    logger.log(`Returned from ${propertyName}: ${JSON.stringify(result)}`, level);
                    return result;
                }
            } catch (err: any) {
                logger.error(`Error in ${propertyName}: ${err?.stack || err}`);
                throw err;
            }
        };

        return descriptor;
    };
}