import { createIpcProxy } from '@trezor/ipc-proxy';
import { CoinjoinBackend } from '@trezor/coinjoin';
import { isDesktop } from '@suite-utils/env';

// const REGTEST_URL = 'https://dev-coinjoin.trezor.io/'; // https://coinjoin.corp.sldev.cz/'; // 'http://localhost:8081/';
const REGTEST_URL = 'https://dev-coinjoin.trezor.io/';
const COINJOIN_NETWORKS: Record<string, any> = {
    regtest: {
        network: 'regtest',
        wabisabiUrl: `${REGTEST_URL}WabiSabi/api/v4/btc`,
        blockbookUrl: `${REGTEST_URL}blockbook/api/v2`,
        baseBlockHeight: 0,
        baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
    },
};

const loadInstance = (network: string) => {
    const settings = COINJOIN_NETWORKS[network];
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

    static async createInstance(network: string) {
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
