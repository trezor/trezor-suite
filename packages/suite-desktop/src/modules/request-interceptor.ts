/**
 * Request Interceptor
 * This module intercepts requests from electron nodejs main process and
 * lets request-manager interceptor knows if Tor is enable so it has to use Tor or not.
 *
 *
 * Differences from request-filter module is that it intercepts all requests from electron nodejs main process,
 * whereas request-filter logs and filters allowed requests from electron renderer process.
 */
import { createInterceptor, InterceptedEvent } from '@trezor/request-manager';
import { isDevEnv } from '@suite-common/suite-utils';

import { Module } from './index';

export const init: Module = ({ store }) => {
    const { logger } = global;

    const options = {
        handler: (event: InterceptedEvent) => {
            if (event.method && event.details) {
                logger.debug('request-interceptor', `${event.method} - ${event.details}`);
            }
        },
        getIsTorEnabled: () => store.getTorSettings().running,
        isDevEnv,
    };

    createInterceptor(options);
};
