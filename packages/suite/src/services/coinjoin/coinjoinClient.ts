/* eslint-disable max-classes-per-file */

// NOTE: class below will be replaced by @trezor/coinjoin implementation

type Settings = {
    network: string;
    coordinatorName: string;
    coordinatorUrl: string;
    middlewareUrl: string;
};

export type Round = {
    id: string;
};

export type CoinjoinStatus = {
    rounds: Round[];
};

export class CoinjoinClient {
    settings: Settings;
    constructor(settings: Settings) {
        this.settings = Object.freeze({
            ...settings,
        });
    }

    registerAccount(_account: any) {}

    unregisterAccount(_accountKey: string) {}

    enable(): Promise<CoinjoinStatus> {
        return Promise.resolve({ rounds: [{ id: '00' }] });
    }
}

const REGTEST_URL = 'http://localhost:8081/'; // 'https://coinjoin.corp.sldev.cz/'
const COINJOIN_NETWORKS: Record<string, Settings> = {
    regtest: {
        network: 'regtest',
        coordinatorName: 'CoinJoinCoordinatorIdentifier',
        coordinatorUrl: `${REGTEST_URL}WabiSabi/`,
        middlewareUrl: `${REGTEST_URL}Cryptography/`,
    },
};

export class CoinjoinClientService {
    private static instances: Record<string, CoinjoinClient> = {};

    static createInstance(network: string) {
        const client = new CoinjoinClient(COINJOIN_NETWORKS[network]);
        this.instances[network] = client;
        return client;
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
