import * as http from '../../src/utils/http';
import { CoinjoinBackendClient } from '../../src/backend/CoinjoinBackendClient';
import { COINJOIN_BACKEND_SETTINGS } from '../fixtures/config.fixture';

type TransactionFixture = {
    txid: string;
    filter: string;
};

type BlockFixture = {
    height: number;
    hash: string;
    previousBlockHash: string;
    filter: string;
    txs: TransactionFixture[];
};

export class MockBackendClient extends CoinjoinBackendClient {
    constructor() {
        super(COINJOIN_BACKEND_SETTINGS);
        this.blocks = [];
        this.mempool = [];
        this.transactions = [];

        jest.spyOn(http, 'httpGet').mockImplementation(this.getWabisabiMock.bind(this));
        jest.spyOn(this.websockets, 'getOrCreate').mockImplementation(
            this.getBlockbookMock.bind(this),
        );
    }

    private blocks: BlockFixture[];
    private mempool: TransactionFixture[];
    private transactions: TransactionFixture[];

    setFixture(blocks: BlockFixture[], mempool: TransactionFixture[] = []) {
        this.blocks = blocks;
        this.mempool = mempool;
        this.transactions = blocks.flatMap(block => block.txs).concat(mempool);
    }

    private mockResponse(status: number, content?: any) {
        const defaultContent = status === 404 ? 'Not found' : undefined;
        return Promise.resolve({
            status,
            json: () => Promise.resolve(content ?? defaultContent),
        } as Response);
    }

    private getWabisabiMock(url: string, { bestKnownBlockHash, count }: Record<string, any> = {}) {
        if (url.endsWith('Blockchain/filters')) {
            if (typeof bestKnownBlockHash !== 'string') this.mockResponse(404);
            if (typeof count !== 'number') return this.mockResponse(404);
            if (this.blocks[this.blocks.length - 1].hash === bestKnownBlockHash)
                return this.mockResponse(204);
            const from = this.blocks.findIndex(
                ({ previousBlockHash }) => previousBlockHash === bestKnownBlockHash,
            );
            if (from >= 0)
                return this.mockResponse(200, {
                    bestHeight: -1,
                    filters: this.blocks
                        .slice(from, from + count)
                        .map(
                            ({ height, hash, filter, previousBlockHash }) =>
                                `${height}:${hash}:${filter}:${previousBlockHash}:${999}`,
                        ),
                });
        }
        return this.mockResponse(404);
    }

    private getBlockbookMock() {
        return new Proxy(
            {},
            {
                get: (_, method, self) => {
                    switch (method) {
                        case 'then':
                            return undefined;
                        case 'catch':
                            return () => self;
                        default:
                            return (...params: any[]) =>
                                this.getBlockbookProxyHandler(method, ...params);
                    }
                },
            },
        ) as any;
    }

    private getBlockbookProxyHandler(method: string | symbol, ...params: any[]) {
        switch (method) {
            case 'getTransaction': {
                const tx = this.transactions.find(t => t.txid === params[0]);
                if (tx) return Promise.resolve(tx as any);
                break;
            }
            case 'getBlock': {
                const block = this.blocks.find(b => b.height === params[0]);
                if (block) return Promise.resolve(block as any);
                break;
            }
            case 'getMempoolFilters': {
                return Promise.resolve({
                    entries: Object.fromEntries(
                        this.mempool.map(({ txid, filter }) => [txid, filter]),
                    ),
                });
            }
            // no default
        }
        throw new Error('not found');
    }

    subscribeMempoolTxs() {
        return Promise.resolve();
    }
}
