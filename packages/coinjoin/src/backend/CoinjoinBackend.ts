import { EventEmitter } from 'events';

import { networks } from '@trezor/utxo-lib';

import { CoinjoinBackendClient } from './CoinjoinBackendClient';
import { CoinjoinFilterController } from './CoinjoinFilterController';
import { getAccountInfo } from './getAccountInfo';
import { getAddressInfo } from './getAddressInfo';
import type { GetAccountInfoParams, DiscoveryProgress, KnownState } from './types';
import { CoinjoinMempoolController } from './CoinjoinMempoolController';

export type CoinjoinBackendSettings = {
    // network: Network;
    network: 'regtest';
    wabisabiUrl: string;
    blockbookUrl: string;
    baseBlockHeight: number;
    baseBlockHash: string;
    storagePath?: string;
};

export declare interface CoinjoinBackend {
    on(event: 'progress', listener: (progress: DiscoveryProgress) => void): this;
    off(event: 'progress', listener: (progress: DiscoveryProgress) => void): this;
}

export class CoinjoinBackend extends EventEmitter {
    readonly settings;

    private readonly client;
    private readonly mempool;

    private abortController: AbortController | undefined;

    constructor(settings: CoinjoinBackendSettings) {
        super();
        this.settings = Object.freeze(settings);
        this.client = new CoinjoinBackendClient(settings);
        this.mempool = new CoinjoinMempoolController(this.client);
    }

    getAccountInfo({ descriptor, knownState }: GetAccountInfoParams) {
        this.abortController = new AbortController();
        const controller = new CoinjoinFilterController(this.client, this.settings);

        return getAccountInfo(
            { descriptor, knownState: knownState ?? this.getClearState() },
            {
                client: this.client,
                network: networks[this.settings.network],
                abortSignal: this.abortController.signal,
                controller,
                mempool: this.mempool,
                onProgress: progress => this.emit('progress', progress),
            },
        );
    }

    getAddressInfo({ descriptor, knownState }: GetAccountInfoParams) {
        this.abortController = new AbortController();
        const controller = new CoinjoinFilterController(this.client, this.settings);

        return getAddressInfo(
            { descriptor, knownState: knownState ?? this.getClearState() },
            {
                client: this.client,
                network: networks[this.settings.network],
                abortSignal: this.abortController.signal,
                controller,
                mempool: this.mempool,
                onProgress: progress => this.emit('progress', progress),
            },
        );
    }

    cancel() {
        this.abortController?.abort();
    }

    private getClearState(): KnownState {
        return {
            blockHash: this.settings.baseBlockHash,
            receiveCount: 0,
            changeCount: 0,
            transactions: [],
        };
    }
}
