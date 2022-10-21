import { EventEmitter } from 'events';

import { httpGet, httpPost, RequestOptions } from '../utils/http';
import type {
    BlockFilter,
    BlockbookBlock,
    BlockFilterResponse,
    BlockbookTransaction,
} from '../types/backend';
import type { CoinjoinBackendSettings } from '../types';

type CoinjoinBackendClientSettings = CoinjoinBackendSettings & {
    timeout?: number;
};

export class CoinjoinBackendClient extends EventEmitter {
    protected readonly wabisabiUrl;
    protected readonly blockbookUrl;
    protected readonly blockCache: BlockbookBlock[] = [];

    constructor(settings: CoinjoinBackendClientSettings) {
        super();
        this.wabisabiUrl = `${settings.wabisabiBackendUrl}api/v4/btc`;
        this.blockbookUrl =
            settings.blockbookUrls[Math.floor(Math.random() * settings.blockbookUrls.length)];
    }

    private fetchAndParseBlock(height: number, options?: RequestOptions): Promise<BlockbookBlock> {
        return this.blockbook(options)
            .get(`block/${height}`)
            .then(this.handleBlockbookResponse.bind(this));
    }

    async fetchBlock(height: number, options?: RequestOptions) {
        if (!this.blockCache[height]) {
            this.blockCache[height] = await this.fetchAndParseBlock(height, options);
        }
        return this.blockCache[height];
    }

    fetchBlocks(heights: number[], options?: RequestOptions): Promise<BlockbookBlock[]> {
        return Promise.all(heights.map(height => this.fetchBlock(height, options)));
    }

    fetchTransaction(txid: string, options?: RequestOptions): Promise<BlockbookTransaction> {
        return this.blockbook(options)
            .get(`tx/${txid}`)
            .then(this.handleBlockbookResponse.bind(this));
    }

    async fetchFilters(
        bestKnownBlockHash: string,
        count: number,
        options?: RequestOptions,
    ): Promise<BlockFilterResponse> {
        const response = await this.wabisabi(options).get('Blockchain/filters', {
            bestKnownBlockHash,
            count,
        });

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

    async fetchMempoolTxids(options?: RequestOptions): Promise<string[]> {
        const response = await this.wabisabi(options).get('Blockchain/mempool-hashes');
        if (response.status === 200) {
            return response.json();
        }

        throw new Error(`${response.status}: ${response.statusText}`);
    }

    // TODO
    async fetchServerInfo(options?: RequestOptions) {
        const res = await this.wabisabi(options).get('Batch/synchronize', {
            bestKnownBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
            maxNumberOfFilters: 0,
            estimateSmartFeeMode: 'Conservative',
        });
        return res.json();
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
        return this.request(this.wabisabiUrl, options);
    }

    protected blockbook(options?: RequestOptions) {
        return this.request(this.blockbookUrl, {
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
