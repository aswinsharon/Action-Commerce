// log.decorator.ts
import { Logger, LogLevel } from '../loggers/logger';

const logger = new Logger();

function safeSerializeArgs(args: any[]) {
    return args.map(arg => {
        // Detect Express request
        if (arg?.constructor?.name === 'IncomingMessage' && arg.method && arg.url) {
            return {
                method: arg.method,
                url: arg.originalUrl || arg.url,
                params: arg.params,
                query: arg.query,
                body: arg.body
            };
        }

        // Detect Express response
        if (arg?.constructor?.name === 'ServerResponse') {
            return '[ServerResponse]';
        }

        // Detect errors
        if (arg instanceof Error) {
            return { message: arg.message, stack: arg.stack };
        }

        // Try safe stringify for other objects
        try {
            return JSON.parse(JSON.stringify(arg));
        } catch {
            return '[Unserializable]';
        }
    });
}

export function LogMethod(level: LogLevel = 'DEBUG') {
    return function (
        target: any,
        propertyName: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const safeArgs = safeSerializeArgs(args);
            logger.log(`Called ${propertyName} with args: ${JSON.stringify(safeArgs)}`, level);

            try {
                const result = originalMethod.apply(this, args);

                if (result instanceof Promise) {
                    return result
                        .then(res => {
                            const safeRes = (() => {
                                try {
                                    return JSON.parse(JSON.stringify(res));
                                } catch {
                                    return '[Unserializable result]';
                                }
                            })();
                            logger.log(`Returned from ${propertyName}: ${JSON.stringify(safeRes)}`, level);
                            return res;
                        })
                        .catch(err => {
                            logger.error(`Error in ${propertyName}: ${err.stack || err}`);
                            throw err;
                        });
                } else {
                    const safeRes = (() => {
                        try {
                            return JSON.parse(JSON.stringify(result));
                        } catch {
                            return '[Unserializable result]';
                        }
                    })();
                    logger.log(`Returned from ${propertyName}: ${JSON.stringify(safeRes)}`, level);
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