import { scheduleAction, arrayShuffle } from '@trezor/utils';
import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';

import { httpGet, RequestOptions } from '../utils/http';
import type {
    BlockFilter,
    BlockbookBlock,
    BlockFilterResponse,
    BlockbookTransaction,
} from '../types/backend';
import type { CoinjoinBackendSettings, Logger } from '../types';
import { FILTERS_REQUEST_TIMEOUT, HTTP_REQUEST_GAP, HTTP_REQUEST_TIMEOUT } from '../constants';
import { CoinjoinWebsocketController, BlockbookWS } from './CoinjoinWebsocketController';
import { isWsError403, resetIdentityCircuit } from './backendUtils';

type CoinjoinBackendClientSettings = CoinjoinBackendSettings & {
    timeout?: number;
    logger?: Logger;
};

export class CoinjoinBackendClient {
    protected readonly logger;
    protected readonly wabisabiUrl;
    protected readonly blockbookUrls;
    protected readonly websockets;
    protected readonly emitter;

    protected blockbookRequestId;

    private identityWabisabi = 'WabisabiApi';
    private readonly identitiesBlockbook = [
        'Blockbook_1',
        'Blockbook_2',
        'Blockbook_3',
        'Blockbook_4',
    ];

    constructor(settings: CoinjoinBackendClientSettings) {
        this.logger = settings.logger;
        this.wabisabiUrl = `${settings.wabisabiBackendUrl}api/v4/btc`;
        this.blockbookUrls = arrayShuffle(settings.blockbookUrls);
        this.blockbookRequestId = Math.floor(Math.random() * settings.blockbookUrls.length);
        this.websockets = new CoinjoinWebsocketController(settings);

        // This allows to subscribe to mempool WS disconnecting in this.subscribeMempoolTxs(),
        // which is then emitted in this.reconnect()
        this.emitter = new TypedEmitter<{ mempoolDisconnected: void }>();
    }

    // Blockbook methods

    fetchBlock(height: number, options?: RequestOptions): Promise<BlockbookBlock> {
        const identity = this.identitiesBlockbook[height & 0x3]; // Works only when identities.length === 4
        return this.fetchFromBlockbook({ identity, ...options }, 'getBlock', height);
    }

    fetchBlockHash(height: number, options?: RequestOptions): Promise<string> {
        return this.fetchFromBlockbook({ ...options }, 'getBlockHash', height).then(
            ({ hash }) => hash,
        );
    }

    fetchTransaction(txid: string, options?: RequestOptions): Promise<BlockbookTransaction> {
        const lastCharCode = txid.charCodeAt(txid.length - 1);
        const identity = this.identitiesBlockbook[lastCharCode & 0x3]; // Works only when identities.length === 4
        return this.fetchFromBlockbook({ identity, ...options }, 'getTransaction', txid);
    }

    fetchNetworkInfo(options?: RequestOptions) {
        return this.fetchFromBlockbook(options, 'getServerInfo');
    }

    fetchAddress(address: string, page?: number, pageSize = 10, options?: RequestOptions) {
        return this.fetchFromBlockbook(options, 'getAccountInfo', {
            descriptor: address,
            details: 'txs',
            pageSize,
            page,
        });
    }

    fetchMempoolFilters(timestamp?: number, options?: RequestOptions) {
        return this.fetchFromBlockbook(
            { ...options, timeout: FILTERS_REQUEST_TIMEOUT },
            'getMempoolFilters',
            timestamp,
        ).then(({ entries }) => entries ?? {});
    }

    private reconnect = async () => {
        let api;
        try {
            const [url] = this.blockbookUrls;
            api = await this.websockets.getOrCreate({ url });
        } catch {
            this.emitter.emit('mempoolDisconnected');
            return;
        }
        api.once('disconnected', this.reconnect);
        if (api.listenerCount('mempool')) {
            await api.subscribeMempool();
        }
    };

    async subscribeMempoolTxs(
        listener: (tx: BlockbookTransaction) => void,
        onDisconnect?: () => void,
    ) {
        const [url] = this.blockbookUrls;
        const api = await this.websockets.getOrCreate({ url });
        api.on('mempool', listener);
        if (onDisconnect) this.emitter.once('mempoolDisconnected', onDisconnect);
        if (api.listenerCount('mempool') === 1) {
            api.once('disconnected', this.reconnect);
            await api.subscribeMempool();
        }
    }

    async unsubscribeMempoolTxs(
        listener: (tx: BlockbookTransaction) => void,
        onDisconnect?: () => void,
    ) {
        const [url] = this.blockbookUrls;
        const api = await this.websockets.getOrCreate({ url });
        api.off('mempool', listener);
        if (onDisconnect) this.emitter.off('mempoolDisconnected', onDisconnect);
        if (!api.listenerCount('mempool')) {
            api.off('disconnected', this.reconnect);
            await api.unsubscribeMempool();
        }
    }

    private fetchFromBlockbook<T extends keyof BlockbookWS>(
        options: RequestOptions | undefined,
        method: T,
        ...params: Parameters<BlockbookWS[T]>
    ) {
        return scheduleAction(
            signal =>
                this.blockbookWS({ ...options, signal }, method, ...params).catch(
                    this.onBlockbookWSError(options),
                ),
            { attempts: 3, timeout: HTTP_REQUEST_TIMEOUT, gap: HTTP_REQUEST_GAP, ...options },
        );
    }

    private onBlockbookWSError(options?: RequestOptions) {
        return (error: Error) => {
            // switch identity in case of 403 (possibly blocked by Cloudflare)
            if (isWsError403(error) && options?.identity) {
                options.identity = resetIdentityCircuit(options.identity);
            }
            throw error;
        };
    }

    protected async blockbookWS<T extends keyof BlockbookWS>(
        { identity, timeout }: RequestOptions = {},
        method: T,
        ...params: Parameters<BlockbookWS[T]>
    ): Promise<Awaited<ReturnType<BlockbookWS[T]>>> {
        const url = this.blockbookUrls[this.blockbookRequestId++ % this.blockbookUrls.length];
        const api = await this.websockets.getOrCreate({ url, timeout, identity });
        this.logger?.debug(`WS ${method} ${params} ${this.websockets.getSocketId(url, identity)}`);
        return (api[method] as any).apply(api, params);
    }

    // Wabisabi methods

    fetchFilters(
        bestKnownBlockHash: string,
        count: number,
        options?: RequestOptions,
    ): Promise<BlockFilterResponse> {
        return this.fetchFromWabisabi(
            this.handleFiltersResponse,
            { ...options, timeout: FILTERS_REQUEST_TIMEOUT },
            'Blockchain/filters',
            { bestKnownBlockHash, count },
        );
    }

    protected async handleFiltersResponse(response: Response): Promise<BlockFilterResponse> {
        switch (response.status) {
            // Provided hash is a tip
            case 204:
                return { status: 'up-to-date' };
            case 200: {
                const result: { bestHeight: number; filters: string[] } = await response.json();
                const filters = result.filters.map<BlockFilter>(data => {
                    const [blockHeight, blockHash, filter, prevHash, blockTime] = data.split(':');
                    return {
                        blockHeight: Number(blockHeight),
                        blockHash,
                        filter,
                        prevHash,
                        blockTime: Number(blockTime),
                    };
                });
                return {
                    status: 'ok',
                    bestHeight: result.bestHeight,
                    filters,
                };
            }
            // hash does not exist, probably reorg
            case 404:
                return { status: 'not-found' };
            default: {
                const error = await response.json().catch(() => response.statusText);
                throw new Error(`${response.status}: ${error}`);
            }
        }
    }

    fetchMempoolTxids(options?: RequestOptions): Promise<string[]> {
        return this.fetchFromWabisabi(
            this.handleMempoolResponse,
            options,
            'Blockchain/mempool-hashes',
        );
    }

    protected handleMempoolResponse(response: Response) {
        if (response.status === 200) {
            return response.json();
        }
        throw new Error(`${response.status}: ${response.statusText}`);
    }

    private fetchFromWabisabi<T>(
        handler: (r: Response) => Promise<T>,
        options: RequestOptions | undefined,
        path: string,
        query?: Record<string, any>,
    ): Promise<T> {
        return scheduleAction(
            signal =>
                this.wabisabiGet(path, query, { ...options, signal }) // "global" signal is overriden by signal passed from scheduleAction
                    .then(this.onWabisabiGetResponse(options))
                    .then(handler.bind(this)),
            { attempts: 3, timeout: HTTP_REQUEST_TIMEOUT, gap: HTTP_REQUEST_GAP, ...options }, // default attempts/timeout could be overriden by options
        );
    }

    private onWabisabiGetResponse(options?: RequestOptions) {
        return (response: Response) => {
            // switch identity in case of 403 (possibly blocked by Cloudflare)
            if (response.status === 403 && options?.identity) {
                options.identity = resetIdentityCircuit(options.identity);
            }
            return response;
        };
    }

    protected wabisabiGet(path: string, query?: Record<string, any>, options?: RequestOptions) {
        const url = `${this.wabisabiUrl}/${path}`;
        const identity = this.identityWabisabi;
        this.logger?.debug(`GET ${url}${query ? `?${new URLSearchParams(query)}` : ''}`);
        return httpGet(url, query, { identity, ...options });
    }
}
