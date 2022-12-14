import { CoinjoinBackend } from '@trezor/coinjoin';
import { createIpcProxy } from '@trezor/ipc-proxy';
import { isDesktop } from '@suite-utils/env';
import { CoinjoinServerEnvironment } from '@wallet-types/coinjoin';
import { NetworkSymbol } from '@wallet-types';
import { getCoinjoinConfig } from './config';

const loadInstance = (network: NetworkSymbol, environment?: CoinjoinServerEnvironment) => {
    const settings = getCoinjoinConfig(network, environment);

    if (isDesktop()) {
        return createIpcProxy<CoinjoinBackend>(
            'CoinjoinBackend',
            { target: { settings } },
            settings,
        );
    }
    return import(/* webpackChunkName: "coinjoin" */ '@trezor/coinjoin').then(
        pkg => new pkg.CoinjoinBackend(settings),
    );
};

export class CoinjoinBackendService {
    private static instances: Record<string, CoinjoinBackend> = {};

    static async createInstance(network: NetworkSymbol, environment?: CoinjoinServerEnvironment) {
        if (this.instances[network]) return this.instances[network];
        const instance = await loadInstance(network, environment);
        this.instances[network] = instance;
        return instance;
    }

    static getInstance(network: NetworkSymbol): CoinjoinBackend | undefined {
        return this.instances[network];
    }

    static getInstances() {
        return Object.keys(this.instances).map(key => this.instances[key]);
    }

    static removeInstance(network: NetworkSymbol) {
        if (this.instances[network]) {
            this.instances[network].cancel();
            delete this.instances[network];
        }
    }
}
