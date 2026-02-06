/**
 * Request Interceptor
 * This module intercepts requests from electron nodejs main process and
 * lets request-manager interceptor knows if Tor is enable so it has to use Tor or not.
 *
 *
 * Differences from request-filter module is that it intercepts all requests from electron nodejs main process,
 * whereas request-filter logs and filters allowed requests from electron renderer process.
 */
import { isDevEnv } from '@suite-common/suite-utils';
import { InterceptedEvent, createInterceptor } from '@trezor/request-manager';
import { TorStatus } from '@trezor/suite-desktop-api';
import { exhaustive } from '@trezor/type-utils';

import { allowedDomains, localhostDomains } from '../config';
import type { ModuleInit } from './module';
import { hasSwitch } from '../libs/process-switches';

export const SERVICE_NAME = 'request-interceptor';

/**
 * Main reason for this whitelist is to mitigate potential dependency attack,
 * where malicious dependency could send requests and potentially spy on the user, etc...
 */
const mainThreadAllowedDomain = {
    general: [...allowedDomains],
    customBackends: {} as Record<string, string[]>,
    coinjoinCoordinatorUrl: undefined as string | undefined,
};

/**
 * This module handles request interception for the main thread.
 */
export const init: ModuleInit = ({ mainWindowProxy, store, mainThreadEmitter }) => {
    const { logger } = global;

    const requestInterceptorEventHandler = (event: InterceptedEvent): void => {
        switch (event.type) {
            case 'INTERCEPTED_REQUEST':
                logger.debug(SERVICE_NAME, `${event.method} - ${event.details}`);

                return;

            case 'INTERCEPTED_RESPONSE':
                logger.debug(
                    SERVICE_NAME,
                    `request to ${event.host} took ${event.time}ms and responded with status code ${event.statusCode}`,
                );

                return;

            case 'NETWORK_MISBEHAVING':
                logger.debug(SERVICE_NAME, 'networks is misbehaving');
                mainWindowProxy.getInstance()?.webContents.send('tor/status', {
                    type: TorStatus.Slow,
                });

                return;

            case 'CIRCUIT_MISBEHAVING':
                mainThreadEmitter.emit('module/reset-tor-circuits', event);

                return;

            case 'INTERCEPTED_HEADERS':
            case 'ERROR':
                return;

            case 'SET_WHITELISTED_DOMAINS_FOR_CUSTOM_BACKENDS':
                mainThreadAllowedDomain.customBackends[event.coin] = event.domains;

                return;

            case 'ADD_WHITELISTED_DOMAIN':
                mainThreadAllowedDomain.general.push(event.domain);

                return;

            default:
                return exhaustive(event);
        }
    };

    // handle event sent from modules/coinjoin (background thread)
    mainThreadEmitter.on('module/request-interceptor', requestInterceptorEventHandler);

    // Allow only the configured list of domains (static config), plus custom backends (variable config by user).
    // In offline mode, block all requests from Electron Main process (except localhost).
    const getWhitelistedDomains = () => {
        if (hasSwitch('offline-mode')) return localhostDomains;

        return [
            ...mainThreadAllowedDomain.general,
            ...Object.values(mainThreadAllowedDomain.customBackends).flat(),
        ];
    };

    createInterceptor({
        handler: requestInterceptorEventHandler,
        getTorSettings: () => store.getTorSettings(),
        allowTorBypass: isDevEnv,
        notRequiredTorDomainsList: ['127.0.0.1', 'localhost', '.sldev.cz'],
        getWhitelistedDomains,
    });
};
