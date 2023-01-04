import { EventEmitter } from 'events';

import { CoinjoinBackendClient } from './CoinjoinBackendClient';
import { CoinjoinFilterController } from './CoinjoinFilterController';
import { CoinjoinMempoolController } from './CoinjoinMempoolController';
import { DISCOVERY_LOOKOUT } from '../constants';
import { scanAccount } from './scanAccount';
import { scanAddress } from './scanAddress';
import { getAccountInfo } from './getAccountInfo';
import { createPendingTransaction } from './createPendingTx';
import { getNetwork } from '../utils/settingsUtils';
import type { CoinjoinBackendSettings, LogEvent, Logger, LogLevel } from '../types';
import type {
    ScanAddressParams,
    ScanAccountParams,
    ScanAddressCheckpoint,
    ScanAccountCheckpoint,
    ScanAccountProgress,
    Transaction,
    AccountCache,
} from '../types/backend';

interface SimpleEvents {
    log: LogEvent;
}

interface DescriptorEvents {
    progress: ScanAccountProgress;
}

type DescriptorEventType<K extends keyof DescriptorEvents, D extends string> = `${K}/${D}`;

export declare interface CoinjoinBackend {
    on<K extends keyof SimpleEvents>(type: K, listener: (event: SimpleEvents[K]) => void): this;
    on<K extends keyof DescriptorEvents, D extends string>(
        type: DescriptorEventType<K, D>,
        listener: (event: DescriptorEvents[K]) => void,
    ): this;

    off<K extends keyof SimpleEvents>(type: K, listener: (event: SimpleEvents[K]) => void): this;
    off<K extends keyof DescriptorEvents, D extends string>(
        type: DescriptorEventType<K, D>,
        listener: (event: DescriptorEvents[K]) => void,
    ): this;

    emit<K extends keyof SimpleEvents>(type: K, ...args: SimpleEvents[K][]): boolean;
    emit<K extends keyof DescriptorEvents, D extends string>(
        type: DescriptorEventType<K, D>,
        ...args: DescriptorEvents[K][]
    ): boolean;

    removeAllListeners<K extends keyof SimpleEvents>(type?: K): this;
    removeAllListeners<K extends keyof DescriptorEvents, D extends string>(
        type?: DescriptorEventType<K, D>,
    ): this;
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
        this.client = new CoinjoinBackendClient({ ...settings, logger: this.getLogger() });

        this.mempool =
            settings.network === 'btc' // mempool scanning is temporarily turned off for mainnet
                ? undefined
                : new CoinjoinMempoolController(this.client);
    }

    scanAccount({ descriptor, progressHandle, checkpoints, cache }: ScanAccountParams) {
        this.abortController = new AbortController();
        const filters = new CoinjoinFilterController(this.client, this.settings);

        return scanAccount(
            { descriptor, checkpoints: this.getCheckpoints(checkpoints), cache },
            {
                client: this.client,
                network: this.network,
                abortSignal: this.abortController.signal,
                filters,
                mempool: this.mempool,
                onProgress: progress =>
                    this.emit(`progress/${progressHandle ?? descriptor}`, progress),
            },
        );
    }

    scanAddress({ descriptor, progressHandle, checkpoints }: ScanAddressParams) {
        this.abortController = new AbortController();
        const filters = new CoinjoinFilterController(this.client, this.settings);

        return scanAddress(
            { descriptor, checkpoints: this.getCheckpoints(checkpoints) },
            {
                client: this.client,
                network: this.network,
                abortSignal: this.abortController.signal,
                filters,
                mempool: this.mempool,
                onProgress: progress =>
                    this.emit(`progress/${progressHandle ?? descriptor}`, {
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
        checkpoint: ScanAccountCheckpoint,
        cache?: AccountCache,
    ) {
        const accountInfo = getAccountInfo({
            descriptor,
            transactions,
            checkpoint,
            cache,
            network: this.network,
        });
        return Promise.resolve(accountInfo);
    }

    getAddressInfo(address: string, transactions: Transaction[]) {
        const addressInfo = getAccountInfo({
            descriptor: address,
            transactions,
            network: this.network,
        });
        return Promise.resolve(addressInfo);
    }

    createPendingTransaction(...args: Parameters<typeof createPendingTransaction>) {
        return Promise.resolve(createPendingTransaction(...args));
    }

    cancel() {
        this.abortController?.abort();
    }

    private getCheckpoints(checkpoints?: ScanAccountCheckpoint[]): ScanAccountCheckpoint[];
    private getCheckpoints(checkpoints?: ScanAddressCheckpoint[]): ScanAddressCheckpoint[];
    private getCheckpoints(checkpoints: any[] = []) {
        if (checkpoints.find(({ blockHeight }) => blockHeight <= this.settings.baseBlockHeight)) {
            throw new Error('Cannot get checkpoint which precedes base block.');
        }

        return checkpoints
            .slice()
            .sort((a, b) => b.blockHeight - a.blockHeight)
            .concat({
                blockHash: this.settings.baseBlockHash,
                blockHeight: this.settings.baseBlockHeight,
                receiveCount: DISCOVERY_LOOKOUT,
                changeCount: DISCOVERY_LOOKOUT,
            });
    }

    private getLogger(): Logger {
        const emit = (level: LogLevel) => (payload: string) => this.emit('log', { level, payload });
        return {
            debug: emit('debug'),
            log: emit('log'),
            warn: emit('warn'),
            error: emit('error'),
        };
    }
}
