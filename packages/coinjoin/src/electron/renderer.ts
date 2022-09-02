/* eslint-disable max-classes-per-file */

// Replacement for @trezor/coinjoin index used in @suite-build/configs/desktop.webpack.config
// original CoinjoinClient and CoinjoinBackend classes are replaced by electron ipc implementation (see ./preloader)

export * as constants from '../constants';

export class CoinjoinClient {
    constructor(settings: any) {
        // @ts-expect-error
        const api = window.CoinjoinIpcChannel;
        if (!api) {
            throw new Error('Coinjoin ipc api not found');
        }
        return api.createClientInstance(settings);
    }
}

export class CoinjoinBackend {
    constructor(settings: any) {
        // @ts-expect-error
        const api = window.CoinjoinIpcChannel;
        if (!api) {
            throw new Error('Coinjoin ipc api not found');
        }
        return api.createBackendInstance(settings);
    }
}
