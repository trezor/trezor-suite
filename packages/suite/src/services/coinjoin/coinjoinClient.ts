import { createIpcProxy } from '@trezor/ipc-proxy';
import { CoinjoinClient } from '@trezor/coinjoin';
import { isDesktop } from '@suite-utils/env';

// const REGTEST_URL = 'https://coinjoin-dev.sldev.cz/'; // 'https://coinjoin.corp.sldev.cz/'; // 'http://localhost:8081/';
const REGTEST_URL = 'https://coinjoin-dev.sldev.cz/'; // 'http://localhost:8081/';
const COINJOIN_NETWORKS: Record<string, any> = {
    regtest: {
        network: 'regtest',
        coordinatorName: 'CoinJoinCoordinatorIdentifier',
        coordinatorUrl: `${REGTEST_URL}WabiSabi/`,
        middlewareUrl: `${REGTEST_URL}Cryptography/`,
    },
};

const loadInstance = (network: string) => {
    const settings = COINJOIN_NETWORKS[network];
    if (isDesktop()) {
        return createIpcProxy<CoinjoinClient>('CoinjoinClient', { target: { settings } }, settings);
    }
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

    static getInstance(network: string) {
        if (!this.instances[network]) {
            return undefined;
        }
        return this.instances[network];
    }

    static getInstances() {
        return Object.keys(this.instances).map(key => this.instances[key]);
    }
}
