import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';

import { CoinjoinBackendClient } from './CoinjoinBackendClient';
import { CoinjoinFilterController } from './CoinjoinFilterController';
import { CoinjoinMempoolController } from './CoinjoinMempoolController';
import { DISCOVERY_LOOKOUT, DISCOVERY_LOOKOUT_EXTENDED } from '../constants';
import { scanAccount } from './scanAccount';
import { scanAddress } from './scanAddress';
import { getAccountInfo } from './getAccountInfo';
import { createPendingTransaction } from './createPendingTx';
import { deriveAddresses, isTaprootAddress } from './backendUtils';
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

interface Events {
    log: LogEvent;
    [event: `progress/${string}`]: ScanAccountProgress;
}

export class CoinjoinBackend extends TypedEmitter<Events> {
    readonly settings: CoinjoinBackendSettings;

    private readonly network;
    private readonly client;
    private readonly mempool;

    private abortController: AbortController | undefined;

    constructor(settings: CoinjoinBackendSettings) {
        super();
        this.settings = Object.freeze(settings);
        this.network = getNetwork(settings.network);
        const logger = this.getLogger();
        this.client = new CoinjoinBackendClient({ ...settings, logger });
        this.mempool = new CoinjoinMempoolController({
            client: this.client,
            network: this.network,
            filter: address => isTaprootAddress(address, this.network),
            logger,
        });
    }

    scanAccount({ descriptor, progressHandle, checkpoints, cache }: ScanAccountParams) {
        this.abortController = new AbortController();
        const filters = new CoinjoinFilterController(this.client, this.settings);

        return scanAccount(
            {
                descriptor,
                checkpoints: this.getCheckpoints(checkpoints),
                cache,
            },
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

    disable() {
        this.abortController?.abort();
        this.mempool.stop();
    }

    private getCheckpoints<T extends ScanAddressCheckpoint>(checkpoints: T[] | undefined): T[];
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
                changeCount: DISCOVERY_LOOKOUT_EXTENDED,
            });
    }

    async getAccountCheckpoint(xpub: string) {
        const { address } = deriveAddresses([], xpub, 'receive', 0, 1, this.network)[0];
        const addressFirstPage = await this.client.fetchAddress(address);

        if (addressFirstPage.txs === 0) {
            const networkInfo = await this.client.fetchNetworkInfo();
            return {
                blockHash: networkInfo.bestHash,
                blockHeight: networkInfo.bestHeight,
                receiveCount: DISCOVERY_LOOKOUT,
                changeCount: DISCOVERY_LOOKOUT_EXTENDED,
            };
        }

        const latestPage =
            addressFirstPage.totalPages > 1
                ? await this.client.fetchAddress(address, addressFirstPage.totalPages)
                : addressFirstPage;

        const transactions = latestPage.transactions!;
        const oldestTx = transactions[transactions.length - 1];
        const blockHeight = oldestTx.blockHeight - 1;
        const blockHash = await this.client.fetchBlockHash(blockHeight);

        return {
            blockHash,
            blockHeight,
            receiveCount: DISCOVERY_LOOKOUT,
            changeCount: DISCOVERY_LOOKOUT_EXTENDED,
        };
    }

    private getLogger(): Logger {
        const emit = (level: LogLevel) => (payload: string) => this.emit('log', { level, payload });
        return {
            debug: emit('debug'),
            info: emit('info'),
            warn: emit('warn'),
            error: emit('error'),
        };
    }
}
