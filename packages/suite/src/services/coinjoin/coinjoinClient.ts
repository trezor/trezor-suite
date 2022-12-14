import { CoinjoinClient } from '@trezor/coinjoin';
import { createIpcProxy } from '@trezor/ipc-proxy';
import { isDesktop } from '@suite-utils/env';
import { CoinjoinServerEnvironment } from '@wallet-types/coinjoin';
import { NetworkSymbol } from '@wallet-types';
import { getCoinjoinConfig } from './config';

const loadInstance = (network: NetworkSymbol, environment?: CoinjoinServerEnvironment) => {
    const settings = getCoinjoinConfig(network, environment);
    if (isDesktop()) {
        return createIpcProxy<CoinjoinClient>('CoinjoinClient', { target: { settings } }, settings);
    }
    return import(/* webpackChunkName: "coinjoin" */ '@trezor/coinjoin').then(
        pkg => new pkg.CoinjoinClient(settings),
    );
};

export class CoinjoinClientService {
    private static instances: Record<string, CoinjoinClient> = {};

    static async createInstance(network: NetworkSymbol, environment?: CoinjoinServerEnvironment) {
        if (this.instances[network]) return this.instances[network];
        const instance = await loadInstance(network, environment);
        this.instances[network] = instance;
        return instance;
    }

    static getInstance(network: NetworkSymbol): CoinjoinClient | undefined {
        return this.instances[network];
    }

    static getInstances() {
        return Object.keys(this.instances).map(key => this.instances[key]);
    }

    static removeInstance(network: NetworkSymbol) {
        if (this.instances[network]) {
            this.instances[network].disable();
            delete this.instances[network];
        }
    }
}
