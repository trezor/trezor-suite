import type { Module } from '../index';

export const SERVICE_NAME = 'event-logging/process';

export const init: Module = () => {
    const { logger } = global;

    process.on('uncaughtException', e => {
        logger.error('exception', e.message);
    });

    process.on('unhandledRejection', (e: Error) => {
        if (e) {
            logger.warn('rejection', `Unhandled Rejection: ${e?.toString()}`);
        }
    });

    // Workaround for misleading message: Use `electron --trace-warnings ...` to show where the warning was created
    // but actually this flag is not working...
    // https://nodejs.org/api/process.html#process_event_warning
    process.on('warning', error => {
        if (error) {
            logger.warn('warning', `Stack: ${error.stack}`);
        }
    });
};
