/**
 * Request Logger (logs intercepted requests from electron main processs)
 *
 * Differences from request-filter module is that it logs all requests from electron nodejs main process,
 * whereas request-filter only logs requests from electron renderer process and it also filters allowed requests.
 */
import { createInterceptor, InterceptedEvent } from '@trezor/request-manager';
import { Module } from './index';

const init: Module = () => {
    const { logger } = global;

    // NodeJS interceptor of the main process network requests.
    createInterceptor((event: InterceptedEvent) => {
        if (event.method && event.details) {
            logger.debug('request-logger', `${event.method} - ${event.details}`);
        }
    });
};

export default init;
