import { CoinjoinBackend, CoinjoinClient } from '@trezor/coinjoin';
import { createIpcProxy } from '@trezor/ipc-proxy';
import { PartialRecord } from '@trezor/type-utils';
import { isDesktop } from '@trezor/env-utils';
import { CoinjoinServerEnvironment } from '@wallet-types/coinjoin';
import { NetworkSymbol } from '@wallet-types';
import { getCoinjoinConfig } from './config';

const loadInstance = (network: NetworkSymbol, environment?: CoinjoinServerEnvironment) => {
    const settings = getCoinjoinConfig(network, environment);
    if (isDesktop()) {
        return Promise.all([
            createIpcProxy<CoinjoinBackend>('CoinjoinBackend', { target: { settings } }, settings),
            createIpcProxy<CoinjoinClient>('CoinjoinClient', { target: { settings } }, settings),
        ] as const);
    }
    return import(/* webpackChunkName: "coinjoin" */ '@trezor/coinjoin').then(
        pkg => [new pkg.CoinjoinBackend(settings), new pkg.CoinjoinClient(settings)] as const,
    );
};

export interface CoinjoinServiceInstance {
    backend: CoinjoinBackend;
    client: CoinjoinClient;
}

export class CoinjoinService {
    private static instances: PartialRecord<NetworkSymbol, CoinjoinServiceInstance> = {};

    static async createInstance(network: NetworkSymbol, environment?: CoinjoinServerEnvironment) {
        if (this.instances[network]) return this.instances[network] as CoinjoinServiceInstance;
        const [backend, client] = await loadInstance(network, environment);
        const instance = { backend, client };
        if (!isDesktop()) {
            // display client log directly in console
            client.on('log', ({ level, payload }) => console[level](payload));
        }

        this.instances[network] = instance;
        return instance;
    }

    static getInstance(network: NetworkSymbol) {
        return this.instances[network];
    }

    static getInstances() {
        return Object.values(this.instances);
    }

    static removeInstance(network: NetworkSymbol) {
        const instance = this.instances[network];
        if (instance) {
            instance.backend.disable();
            instance.client.disable();
            delete this.instances[network];
        }
    }
}
