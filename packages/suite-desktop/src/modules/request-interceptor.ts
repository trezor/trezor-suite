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
import { TorStatus } from '@trezor/suite-desktop-api';

import { Module } from './index';

export const init: Module = ({ mainWindow, store, mainThreadEmitter }) => {
    const { logger } = global;

    const requestInterceptorEventHandler = (event: InterceptedEvent) => {
        if (event.type === 'INTERCEPTED_REQUEST') {
            logger.debug('request-interceptor', `${event.method} - ${event.details}`);
        }
        if (event.type === 'INTERCEPTED_RESPONSE') {
            logger.debug(
                'request-interceptor',
                `request to ${event.host} took ${event.time}ms and responded with status code ${event.statusCode}`,
            );
        }
        if (event.type === 'NETWORK_MISBEHAVING') {
            logger.debug('request-interceptor', 'networks is misbehaving');
            mainWindow.webContents.send('tor/status', {
                type: TorStatus.Misbehaving,
            });
        }

        if (event.type === 'CIRCUIT_MISBEHAVING') {
            mainThreadEmitter.emit('module/reset-tor-circuits', event);
        }
    };

    // handle event sent from modules/coinjoin (background thread)
    mainThreadEmitter.on('module/request-interceptor', requestInterceptorEventHandler);

    createInterceptor({
        handler: requestInterceptorEventHandler,
        getTorSettings: () => store.getTorSettings(),
        allowTorBypass: isDevEnv,
        whitelistedHosts: ['127.0.0.1', 'localhost', '.sldev.cz'],
    });
};
