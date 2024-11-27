import { CoinjoinBackend, CoinjoinClient, CoinjoinPrisonInmate } from '@trezor/coinjoin';
import { createIpcProxy } from '@trezor/ipc-proxy';
import { PartialRecord } from '@trezor/type-utils';
import { isDesktop } from '@trezor/env-utils';

import type { CoinjoinNetworksConfig, CoinjoinSymbol } from './config';
import { getCoinjoinConfig } from './config';

const loadInstance = (settings: ReturnType<typeof getCoinjoinConfig>) => {
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

type CoinjoinCreateInstance = {
    symbol: CoinjoinSymbol;
    prison?: CoinjoinPrisonInmate[];
    settings?: CoinjoinNetworksConfig;
};

export class CoinjoinService {
    private static instances: PartialRecord<CoinjoinSymbol, CoinjoinServiceInstance> = {};

    static async createInstance({ symbol, prison, settings }: CoinjoinCreateInstance) {
        if (this.instances[symbol]) return this.instances[symbol] as CoinjoinServiceInstance;
        const config = settings ?? getCoinjoinConfig(symbol);
        const [backend, client] = await loadInstance({ ...config, prison });
        const instance = { backend, client };
        if (!isDesktop()) {
            // display client log directly in console
            client.on('log', ({ level, payload }) => console[level](payload));
        }

        this.instances[symbol] = instance;

        return instance;
    }

    static getInstance(symbol: CoinjoinSymbol) {
        return this.instances[symbol];
    }

    static getInstances() {
        return Object.values(this.instances);
    }

    static removeInstance(symbol: CoinjoinSymbol) {
        const instance = this.instances[symbol];
        if (instance) {
            instance.backend.disable();
            instance.client.disable();
            delete this.instances[symbol];
        }
    }
}
