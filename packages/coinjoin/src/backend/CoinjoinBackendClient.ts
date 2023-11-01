import { scheduleAction, arrayShuffle, urlToOnion } from '@trezor/utils';
import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';
import type { BlockbookAPI } from '@trezor/blockchain-link/lib/workers/blockbook/websocket';

import { RequestOptions, resetIdentityCircuit } from '../utils/http';
import type {
    BlockbookBlock,
    BlockFilterResponse,
    MempoolFilterResponse,
    BlockbookTransaction,
} from '../types/backend';
import type { CoinjoinBackendSettings, Logger } from '../types';
import { FILTERS_REQUEST_TIMEOUT, HTTP_REQUEST_GAP, HTTP_REQUEST_TIMEOUT } from '../constants';
import { CoinjoinWebsocketController } from './CoinjoinWebsocketController';
import { identifyWsError } from './backendUtils';

type CoinjoinBackendClientSettings = CoinjoinBackendSettings & {
    timeout?: number;
    logger?: Logger;
};

export class CoinjoinBackendClient {
    protected readonly logger;
    protected readonly blockbookUrls;
    protected readonly onionDomains;
    protected readonly websockets;
    protected readonly emitter;

    protected blockbookRequestId;
    protected persistentApi?: BlockbookAPI;

    private readonly identitiesBlockbook = [
        'Blockbook_1',
        'Blockbook_2',
        'Blockbook_3',
        'Blockbook_4',
    ];

    constructor(settings: CoinjoinBackendClientSettings) {
        this.logger = settings.logger;
        this.blockbookUrls = arrayShuffle(settings.blockbookUrls);
        this.onionDomains = settings.onionDomains ?? {};
        this.blockbookRequestId = Math.floor(Math.random() * settings.blockbookUrls.length);
        this.websockets = new CoinjoinWebsocketController(settings);

        // This allows to subscribe to mempool WS disconnecting in this.subscribeMempoolTxs(),
        // which is then emitted in this.reconnect()
        this.emitter = new TypedEmitter<{ mempoolDisconnected: void }>();
    }

    fetchBlock(height: number, options?: RequestOptions): Promise<BlockbookBlock> {
        const identity = this.identitiesBlockbook[height & 0x3]; // Works only when identities.length === 4
        return this.getBlockbookApi(api => api.getBlock(height), { identity, ...options });
    }

    fetchBlockHash(height: number, options?: RequestOptions): Promise<string> {
        return this.getBlockbookApi(api => api.getBlockHash(height), { ...options }).then(
            ({ hash }) => hash,
        );
    }

    fetchTransaction(txid: string, options?: RequestOptions): Promise<BlockbookTransaction> {
        const lastCharCode = txid.charCodeAt(txid.length - 1);
        const identity = this.identitiesBlockbook[lastCharCode & 0x3]; // Works only when identities.length === 4
        return this.getBlockbookApi(api => api.getTransaction(txid), { identity, ...options });
    }

    fetchNetworkInfo(options?: RequestOptions) {
        return this.getBlockbookApi(api => api.getServerInfo(), options);
    }

    fetchAddress(address: string, page?: number, pageSize = 10, options?: RequestOptions) {
        return this.getBlockbookApi(
            api => api.getAccountInfo({ descriptor: address, details: 'txs', pageSize, page }),
            options,
        );
    }

    fetchBlockFilters(bestKnownBlockHash: string, pageSize: number, options?: RequestOptions) {
        return this.getBlockbookApi(
            api =>
                api
                    .getBlockFiltersBatch(bestKnownBlockHash, pageSize)
                    .then<BlockFilterResponse>(({ blockFiltersBatch, ...rest }) => {
                        if (!blockFiltersBatch.length) return { status: 'up-to-date' };
                        const filters = blockFiltersBatch.map(item => {
                            const [blockHeight, blockHash, filter] = item.split(':');
                            return { blockHeight: Number(blockHeight), blockHash, filter };
                        });
                        return { status: 'ok', filters, ...rest };
                    })
                    .catch<BlockFilterResponse>(error => {
                        if (identifyWsError(error) === 'ERROR_BLOCK_NOT_FOUND') {
                            return { status: 'not-found' };
                        }
                        throw error;
                    }),
            { ...options, timeout: FILTERS_REQUEST_TIMEOUT },
        );
    }

    async fetchMempoolFilters(timestamp?: number, options?: RequestOptions) {
        const result = await this.getBlockbookApi(
            api =>
                api
                    .getMempoolFilters(timestamp)
                    .then(response => ({ fallbackNeeded: false, response }) as const)
                    .catch(error => {
                        if (identifyWsError(error) === 'ERROR_UNSUPPORTED_NOORDINALS') {
                            return { fallbackNeeded: true } as const;
                        }
                        throw error;
                    }),
            { ...options, timeout: FILTERS_REQUEST_TIMEOUT },
        );

        const { entries = {}, ...rest } = !result.fallbackNeeded
            ? result.response
            : // When BB doesn't support 'taproot-noordinals' mempool filters yet,
              // fall back to previously supported 'taproot' filters
              await this.getBlockbookApi(
                  api => api.getMempoolFilters(timestamp, { scriptType: 'taproot' }),
                  { ...options, timeout: FILTERS_REQUEST_TIMEOUT },
              );

        return { entries, ...rest } as MempoolFilterResponse;
    }

    private reconnect = async () => {
        if (!this.persistentApi) return;

        let newApi: BlockbookAPI;
        try {
            newApi = await this.getBlockbookApi(api => api);
        } catch {
            this.emitter.emit('mempoolDisconnected');
            return;
        }

        // move all the mempool listeners from the old api to the new one
        if (this.persistentApi.listenerCount('mempool')) {
            this.persistentApi
                .listeners('mempool')
                .forEach(listener => newApi.on('mempool', listener));
            this.persistentApi.removeAllListeners('mempool');
            await newApi.subscribeMempool();
        }

        newApi.once('disconnected', this.reconnect);
        this.persistentApi = newApi;
    };

    async subscribeMempoolTxs(
        listener: (tx: BlockbookTransaction) => void,
        onDisconnect?: () => void,
    ) {
        if (!this.persistentApi) {
            this.persistentApi = await this.getBlockbookApi(api => api);
            this.persistentApi.once('disconnected', this.reconnect);
            await this.persistentApi.subscribeMempool();
        }

        this.persistentApi.on('mempool', listener);
        if (onDisconnect) this.emitter.once('mempoolDisconnected', onDisconnect);
    }

    async unsubscribeMempoolTxs(
        listener: (tx: BlockbookTransaction) => void,
        onDisconnect?: () => void,
    ) {
        if (!this.persistentApi) return;

        this.persistentApi.off('mempool', listener);
        if (onDisconnect) this.emitter.off('mempoolDisconnected', onDisconnect);

        if (!this.persistentApi.listenerCount('mempool')) {
            this.persistentApi.off('disconnected', this.reconnect);
            await this.persistentApi.unsubscribeMempool();
            this.persistentApi = undefined;
        }
    }

    private getBlockbookApi<T>(
        callbackFn: (api: BlockbookAPI) => T | Promise<T>,
        { identity, ...options }: RequestOptions = {},
    ): Promise<T> {
        let preferOnion = true;
        return scheduleAction(
            async () => {
                const urlIndex = this.blockbookRequestId++ % this.blockbookUrls.length;
                const clearnet = this.blockbookUrls[urlIndex];
                const url = (preferOnion && urlToOnion(clearnet, this.onionDomains)) || clearnet;
                const api = await this.websockets
                    .getOrCreate({ identity, ...options, url })
                    .catch(error => {
                        const errorType = identifyWsError(error);
                        if (errorType === 'ERROR_FORBIDDEN' && identity) {
                            // switch identity in case of 403 (possibly blocked by Cloudflare)
                            identity = resetIdentityCircuit(identity);
                        } else if (errorType === 'ERROR_TIMEOUT') {
                            // try clearnet url in case of timeout
                            preferOnion = false;
                        }
                        throw error;
                    });
                return callbackFn(api);
            },
            { attempts: 3, timeout: HTTP_REQUEST_TIMEOUT, gap: HTTP_REQUEST_GAP, ...options },
        );
    }
}
