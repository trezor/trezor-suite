import { EventEmitter } from 'events';

export type CoinjoinClientSettings = {
    network: string;
    coordinatorName: string;
    coordinatorUrl: string;
    middlewareUrl: string;
};

// export interface CoinjoinClientSettings {
//     network: 'btc' | 'test' | 'regtest';
//     state?: any; // TODO: cache for state (rounds inputs...)
//     coordinatorName: string; // identifier used in commitment data and ownership proof
//     coordinatorUrl: string;
//     middlewareUrl: string;
// }

// export type CoinjoinBackendSettings = {
//     // network: Network; // it is better to proved string from suite
//     network: 'btc' | 'test' | 'regtest';
//     wabisabiUrl: string; // coordinatorUrl ?
//     // blockbookUrl: string; // this should be a array, maybe not only blockbook in the future
//     blockbookUrl: string[];
//     baseBlockHeight: number; // get it from config (by network name)
//     baseBlockHash: string; // get it from config (by network name)
//     storagePath?: string; // not used?
// };

// export type CoinjoinSettingsMerged = {
//     network: 'btc' | 'test' | 'regtest';
//     coordinatorName: string; // identifier used in commitment data and ownership proof
//     coordinatorUrl: string; // wasabi backend url, used in backend and client modules
//     blockProviders: string[]; //
//     middlewareUrl: string; // middleware (CoinjoinClientLibrary from wasabi)
// };

export type Round = {
    id: string;
};

export type Account = {
    descriptor: string;
};

export type CoinjoinStatus = {
    rounds: Round[];
};

export interface StatusUpdateEvent {
    rounds: Round[];
    changed: Round[];
    feeRatesMedians: any[];
}

interface CoinjoinClientEvents {
    status: StatusUpdateEvent;
}

export declare interface CoinjoinClient {
    on<K extends keyof CoinjoinClientEvents>(
        type: K,
        listener: (
            network: CoinjoinClientSettings['network'],
            event: CoinjoinClientEvents[K],
        ) => void,
    ): this;
    off<K extends keyof CoinjoinClientEvents>(
        type: K,
        listener: (
            network: CoinjoinClientSettings['network'],
            event: CoinjoinClientEvents[K],
        ) => void,
    ): this;
    emit<K extends keyof CoinjoinClientEvents>(
        type: K,
        network: CoinjoinClientSettings['network'],
        ...args: CoinjoinClientEvents[K][]
    ): boolean;
    removeAllListeners<K extends keyof CoinjoinClientEvents>(type?: K): this;
}

export class CoinjoinClient extends EventEmitter {
    readonly settings: CoinjoinClientSettings;

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = settings;
    }

    enable() {
        return Promise.resolve<CoinjoinStatus>({ rounds: [{ id: '00' }] });
    }

    disable() {}

    registerAccount(_account: Account) {}

    updateAccount(_account: Account) {}

    unregisterAccount(_descriptor: string) {}

    resolveRequest() {}
}
