import { CoinjoinClient } from '@trezor/coinjoin';
import { COINJOIN_NETWORKS } from './config';

const loadInstance = (network: string) => {
    const settings = COINJOIN_NETWORKS[network];
    return import(/* webpackChunkName: "coinjoin" */ '@trezor/coinjoin').then(
        pkg => new pkg.CoinjoinClient(settings),
    );
};

export class CoinjoinClientService {
    private static instances: Record<string, CoinjoinClient> = {};

    static async createInstance(network: string) {
        if (this.instances[network]) return this.instances[network];
        const instance = await loadInstance(network);
        this.instances[network] = instance;
        return instance;
    }

    static getInstance(network: string): CoinjoinClient | undefined {
        return this.instances[network];
    }

    static getInstances() {
        return Object.keys(this.instances).map(key => this.instances[key]);
    }
}
