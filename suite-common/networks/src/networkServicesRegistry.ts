import type { NetworksServices } from './NetworksServices';

let networkServices: NetworksServices | null = null;

/**
 * Registers the application-owned services for legacy static wallet-config consumers.
 * @deprecated Remove this bridge once all callers access services through DI.
 */
export const registerNetworkServices = (services: NetworksServices): void => {
    networkServices = services;
};

/**
 * @deprecated Use injected network services. The application root must register them before use.
 */
export const getNetworkServices = (): NetworksServices => {
    if (networkServices === null) {
        throw new Error('Network services have not been registered.');
    }

    return networkServices;
};
