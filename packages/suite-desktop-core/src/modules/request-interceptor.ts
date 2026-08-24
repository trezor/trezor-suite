/**
 * Request Interceptor
 * This module intercepts requests from Electron Main process (direct network requests from nodejs) and
 * lets request-manager interceptor knows if Tor is enabled (whether it has to use Tor or not).
 *
 * Differences from request-filter module is that it intercepts all requests from Electron Main process (nodejs),
 * whereas request-filter logs and filters allowed requests from electron renderer process.
 */
import { TorStatus } from '@suite/tor-types';
import { isDevEnv } from '@suite-common/suite-utils';
import { type InterceptedEvent, createInterceptor } from '@trezor/request-manager';
import { exhaustive } from '@trezor/type-utils';

import { allowedDomains, localhostDomains } from '../config';
import type { ModuleInit } from './module';
import { hasSwitch } from '../libs/process-switches';
import {
    validateWhitelistedHostname,
    validateWhitelistedHostnames,
} from '../libs/validateWhitelistedHostname';

export const SERVICE_NAME = 'request-interceptor';

const warn = (message: string) => logger.warn(SERVICE_NAME, message);

type CustomBackendsPerNetworkSymbol = Record<string, string[]>;
type CoinjoinCoordinatorPerNetworkSymbol = Record<string, string | undefined>;
type MainThreadAllowedDomain = {
    general: string[];
    customBackends: CustomBackendsPerNetworkSymbol;
    coinjoinCoordinatorDomains: CoinjoinCoordinatorPerNetworkSymbol;
};

/**
 * Main reason for this whitelist is to mitigate potential dependency attack,
 * where malicious dependency could send requests and potentially spy on the user, etc...
 */
const mainThreadAllowedDomain: MainThreadAllowedDomain = {
    general: [...allowedDomains],
    customBackends: {},
    coinjoinCoordinatorDomains: {},
};

/**
 * This module handles request interception for the electron Main thread.
 *
 * Please note that the `interceptor` from ModuleInit api is for the Renderer process, so we don't use it here.
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

            case 'SET_WHITELISTED_DOMAINS_FOR_CUSTOM_BACKENDS': {
                mainThreadAllowedDomain.customBackends[event.coin] = validateWhitelistedHostnames({
                    hostnames: event.domains,
                    warn,
                });

                return;
            }

            case 'SET_WHITELISTED_DOMAIN_FOR_COINJOIN_COORDINATOR': {
                const hostname = event.domain;
                if (hostname === null) {
                    delete mainThreadAllowedDomain.coinjoinCoordinatorDomains[event.coin];

                    return;
                }
                const validatedHostname = validateWhitelistedHostname({ hostname, warn });
                mainThreadAllowedDomain.coinjoinCoordinatorDomains[event.coin] = validatedHostname;

                return;
            }

            case 'ADD_WHITELISTED_DOMAIN': {
                const hostname = event.domain;
                const validatedHostname = validateWhitelistedHostname({ hostname, warn });

                if (validatedHostname !== undefined) {
                    mainThreadAllowedDomain.general.push(validatedHostname);
                }

                return;
            }

            default:
                return exhaustive(event);
        }
    };

    // handle event sent from modules/coinjoin (background thread)
    mainThreadEmitter.on('module/request-interceptor', requestInterceptorEventHandler);

    // Allow only the configured list of domains (static config), plus variable custom backends and
    // active coinjoin coordinator domains.
    // In offline mode, block all requests from Electron Main process (except localhost).
    const getWhitelistedDomains = () => {
        if (hasSwitch('offline-mode')) return localhostDomains;

        return [
            ...mainThreadAllowedDomain.general,
            ...Object.values(mainThreadAllowedDomain.customBackends).flat(),
            ...Object.values(mainThreadAllowedDomain.coinjoinCoordinatorDomains).filter(
                (domain): domain is string => domain !== undefined,
            ),
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
