import type { Module } from '../index';

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
};
