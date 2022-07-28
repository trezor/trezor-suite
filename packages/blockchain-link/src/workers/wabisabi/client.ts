import { EventEmitter } from 'events';
import { httpRequest } from './http';
import type { BlockFilter, BlockbookTransaction } from './types';

// http://localhost:8081/api/v4/btc/Batch/synchronize?bestKnownBlockHash=0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206&maxNumberOfFilters=2&estimateSmartFeeMode=Conservative
// http://localhost:8081/WabiSabi/api/v4/btc/Blockchain/synchronize?bestKnownBlockHash=0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206&maxNumberOfFilters=10&estimateSmartFeeMode=Conservative
// http://localhost:8081/WabiSabi/api/v4/btc/Batch/synchronize?bestKnownBlockHash=0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206&maxNumberOfFilters=2&estimateSmartFeeMode=Conservative
// http://localhost:8081/WabiSabi/api/v4/btc/Blockchain/Batch/synchronize?bestKnownBlockHash=0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206&maxNumberOfFilters=10&estimateSmartFeeMode=Conservative
// '/api/v4/btc/Blockchain/status'

const WABISABI_URL = 'http://localhost:8081/WabiSabi/api/v4/btc';
const BLOCKBOOK_URL = 'http://localhost:8081/blockbook/api/v2';

export type BlockbookBlock = {
    height: number;
    txs: BlockbookTransaction[];
};

type WabiSabiClientOptions = {
    wabisabiUrl?: string;
    blockbookUrl?: string;
    timeout?: number;
};

export class WabiSabiClient extends EventEmitter {
    protected readonly wabisabiUrl;
    protected readonly blockbookUrl;

    constructor(options?: WabiSabiClientOptions) {
        super();
        this.wabisabiUrl = options?.wabisabiUrl || WABISABI_URL;
        this.blockbookUrl = options?.blockbookUrl || BLOCKBOOK_URL;
    }

    isConnected() {
        return true;
    }

    connect() {
        return false;
    }

    disconnect() {
        return false;
    }

    getBlock() {}

    private async fetchBlockImpl(height: number): Promise<BlockbookBlock> {
        const response = await httpRequest(
            `/block/${height}`, // TODO: rawblock on new not released blockbook
            {},
            { method: 'GET', baseUrl: this.blockbookUrl },
        );
        if (response.status === 200) {
            return response.json();
        }
        if (response.status >= 400 && response.status < 500) {
            const { error } = await response.json();
            throw new Error(`${response.status}: ${error}`);
        }
        throw new Error(`${response.status}: ${response.statusText}`);
    }

    private blockCache: BlockbookBlock[] = [];

    async fetchBlock(height: number) {
        if (!this.blockCache[height]) {
            this.blockCache[height] = await this.fetchBlockImpl(height);
        }
        return this.blockCache[height];
    }

    fetchBlocks(heights: number[]): Promise<BlockbookBlock[]> {
        return Promise.all(heights.map(this.fetchBlock.bind(this)));
    }

    async fetchFilters(bestKnownBlockHash: string, count: number) {
        const response = await httpRequest(
            '/Blockchain/filters',
            {
                bestKnownBlockHash,
                count,
            },
            { method: 'GET', baseUrl: this.wabisabiUrl },
        );

        if (response.status === 204) {
            // Provided hash is a tip
            return [];
        }
        if (response.status === 200) {
            const result: { bestHeight: number; filters: string[] } = await response.json();
            return result.filters.map<BlockFilter>(data => {
                const [blockHeight, blockHash, filter, prevHash, blockTime] = data.split(':');
                return {
                    blockHeight: Number(blockHeight),
                    blockHash,
                    filter,
                    prevHash,
                    blockTime: Number(blockTime),
                };
            });
        }
        if (response.status >= 400 && response.status < 500) {
            const error = await response.json();
            throw new Error(`${response.status}: ${error}`);
        }
        throw new Error(`${response.status}: ${response.statusText}`);
    }

    fetchServerInfo() {
        return httpRequest(
            '/Batch/synchronize',
            {
                bestKnownBlockHash:
                    '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
                maxNumberOfFilters: 0,
                estimateSmartFeeMode: 'Conservative',
            },
            { method: 'GET', baseUrl: this.wabisabiUrl },
        ).then(res => res.json());
    }
}
