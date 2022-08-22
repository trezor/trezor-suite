import { EventEmitter } from 'events';

import { CoinjoinBackendClient } from './CoinjoinBackendClient';
import { CoinjoinFilterController } from './CoinjoinFilterController';
import { CoinjoinMempoolController } from './CoinjoinMempoolController';
import { DISCOVERY_LOOKOUT } from '../constants';
import { scanAccount } from './scanAccount';
import { scanAddress } from './scanAddress';
import { getAccountInfo } from './getAccountInfo';
import { getNetwork } from '../utils/settingsUtils';
import type { CoinjoinBackendSettings } from '../types';
import type {
    ScanAddressParams,
    ScanAccountParams,
    ScanAccountCheckpoint,
    ScanAccountProgress,
    Transaction,
} from '../types/backend';

interface Events {
    progress: ScanAccountProgress;
}

export declare interface CoinjoinBackend {
    on<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    off<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    emit<K extends keyof Events>(type: K, ...args: Events[K][]): boolean;
    removeAllListeners<K extends keyof Events>(type?: K): this;
}

export class CoinjoinBackend extends EventEmitter {
    readonly settings: CoinjoinBackendSettings;

    private readonly network;
    private readonly client;
    private readonly mempool;

    private abortController: AbortController | undefined;

    constructor(settings: CoinjoinBackendSettings) {
        super();
        this.settings = Object.freeze(settings);
        this.network = getNetwork(settings.network);
        this.client = new CoinjoinBackendClient(settings);
        this.mempool = new CoinjoinMempoolController(this.client);
    }

    scanAccount({ descriptor, checkpoint }: ScanAccountParams) {
        this.abortController = new AbortController();
        const filters = new CoinjoinFilterController(this.client, this.settings);

        return scanAccount(
            { descriptor, checkpoint: checkpoint ?? this.getInitialCheckpoint() },
            {
                client: this.client,
                network: this.network,
                abortSignal: this.abortController.signal,
                filters,
                mempool: this.mempool,
                onProgress: progress => this.emit('progress', progress),
            },
        );
    }

    scanAddress({ descriptor, checkpoint }: ScanAddressParams) {
        this.abortController = new AbortController();
        const filters = new CoinjoinFilterController(this.client, this.settings);

        return scanAddress(
            { descriptor, checkpoint: checkpoint ?? this.getInitialCheckpoint() },
            {
                client: this.client,
                network: this.network,
                abortSignal: this.abortController.signal,
                filters,
                mempool: this.mempool,
                onProgress: progress =>
                    this.emit('progress', {
                        ...progress,
                        // TODO resolve this correctly
                        checkpoint: { ...progress.checkpoint, receiveCount: -1, changeCount: -1 },
                    }),
            },
        );
    }

    getAccountInfo(
        descriptor: string,
        transactions: Transaction[],
        checkpoint?: ScanAccountCheckpoint,
    ) {
        const accountInfo = getAccountInfo({
            descriptor,
            transactions,
            checkpoint,
            network: this.network,
        });
        return Promise.resolve(accountInfo);
    }

    cancel() {
        this.abortController?.abort();
    }

    private getInitialCheckpoint(): ScanAccountCheckpoint {
        return {
            blockHash: this.settings.baseBlockHash,
            blockHeight: this.settings.baseBlockHeight,
            receiveCount: DISCOVERY_LOOKOUT,
            changeCount: DISCOVERY_LOOKOUT,
        };
    }
}
