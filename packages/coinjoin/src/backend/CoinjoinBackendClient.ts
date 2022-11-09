import { scheduleAction } from '@trezor/utils';

import { httpGet, httpPost, RequestOptions } from '../utils/http';
import type {
    BlockFilter,
    BlockbookBlock,
    BlockFilterResponse,
    BlockbookTransaction,
} from '../types/backend';
import type { CoinjoinBackendSettings } from '../types';
import { HTTP_REQUEST_TIMEOUT } from '../constants';

type CoinjoinBackendClientSettings = CoinjoinBackendSettings & {
    timeout?: number;
};

export class CoinjoinBackendClient {
    protected readonly wabisabiUrl;
    protected readonly blockbookUrls;

    private readonly identityWabisabi = 'Satoshi';
    private readonly identitiesBlockbook = [
        'Blockbook_1',
        'Blockbook_2',
        'Blockbook_3',
        'Blockbook_4',
    ];

    constructor(settings: CoinjoinBackendClientSettings) {
        this.wabisabiUrl = `${settings.wabisabiBackendUrl}api/v4/btc`;
        this.blockbookUrls = settings.blockbookUrls;
    }

    getIdentityForBlock(height: number | undefined) {
        return this.identitiesBlockbook[(height ?? 0) & 0x3]; // Works only when identities.length === 4
    }

    fetchBlock(height: number, options?: RequestOptions): Promise<BlockbookBlock> {
        const identity = this.getIdentityForBlock(height);
        return this.scheduleGet(
            this.blockbook,
            this.handleBlockbookResponse,
            { identity, ...options },
            `block/${height}`,
        );
    }

    fetchBlocks(heights: number[], options?: RequestOptions): Promise<BlockbookBlock[]> {
        return Promise.all(heights.map(height => this.fetchBlock(height, options)));
    }

    fetchTransaction(txid: string, options?: RequestOptions): Promise<BlockbookTransaction> {
        return this.scheduleGet(
            this.blockbook,
            this.handleBlockbookResponse,
            options,
            `tx/${txid}`,
        );
    }

    fetchFilters(
        bestKnownBlockHash: string,
        count: number,
        options?: RequestOptions,
    ): Promise<BlockFilterResponse> {
        return this.scheduleGet(
            this.wabisabi,
            this.handleFiltersResponse,
            options,
            'Blockchain/filters',
            { bestKnownBlockHash, count },
        );
    }

    protected async handleFiltersResponse(response: Response) {
        if (response.status === 204) {
            // Provided hash is a tip
            return {
                bestHeight: -1,
                filters: [],
            };
        }
        if (response.status === 200) {
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
                bestHeight: result.bestHeight,
                filters,
            };
        }
        if (response.status >= 400 && response.status < 500) {
            const error = await response.json();
            throw new Error(`${response.status}: ${error}`);
        }
        throw new Error(`${response.status}: ${response.statusText}`);
    }

    fetchMempoolTxids(options?: RequestOptions): Promise<string[]> {
        return this.scheduleGet(
            this.wabisabi,
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

    protected scheduleGet<T>(
        backend: CoinjoinBackendClient['blockbook' | 'wabisabi'],
        handler: (r: Response) => Promise<T>,
        options: RequestOptions | undefined,
        path: string,
        query?: Record<string, any>,
    ): Promise<T> {
        return scheduleAction(
            signal =>
                backend
                    .call(this, { ...options, signal }) // "global" signal is overriden by signal passed from scheduleAction
                    .get(path, query)
                    .then(handler.bind(this)),
            { attempts: 3, timeout: HTTP_REQUEST_TIMEOUT, ...options }, // default attempts/timeout could be overriden by options
        );
    }

    protected async handleBlockbookResponse(response: Response) {
        if (response.status === 200) {
            return response.json();
        }

        if (response.status >= 400 && response.status < 500) {
            const { error } = await response.json();
            throw new Error(`${response.status}: ${error}`);
        }
        throw new Error(`${response.status}: ${response.statusText}`);
    }

    protected wabisabi(options?: RequestOptions) {
        return this.request(this.wabisabiUrl, { identity: this.identityWabisabi, ...options });
    }

    protected blockbook(options?: RequestOptions) {
        const url = this.blockbookUrls[Math.floor(Math.random() * this.blockbookUrls.length)];
        return this.request(url, {
            ...options,
            userAgent: '', // blockbook api requires user-agent to be sent, see ./utils/http.ts
        });
    }

    private request(url: string, options?: RequestOptions) {
        return {
            get: (path: string, query?: Record<string, any>) =>
                httpGet(`${url}/${path}`, query, options),
            post: (path: string, body?: Record<string, any>) =>
                httpPost(`${url}/${path}`, body, options),
        };
    }
}
