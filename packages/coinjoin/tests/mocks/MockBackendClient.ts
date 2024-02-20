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
            case 'getServerInfo': {
                return Promise.resolve({ bestHeight: this.blocks[this.blocks.length - 1].height });
            }
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
            case 'getBlockFiltersBatch': {
                const bestKnownBlockHash = params[0];
                const count = params[1];

                if (this.blocks[this.blocks.length - 1].hash === bestKnownBlockHash)
                    return Promise.resolve({ blockFiltersBatch: [] });
                const from = this.blocks.findIndex(
                    ({ previousBlockHash }) => previousBlockHash === bestKnownBlockHash,
                );
                if (from >= 0)
                    return Promise.resolve({
                        blockFiltersBatch: this.blocks
                            .slice(from, from + count)
                            .map(({ height, hash, filter }) => `${height}:${hash}:${filter}`),
                    });

                return Promise.reject(new Error('Block not found'));
            }
            // no default
        }
        throw new Error('not found');
    }

    subscribeMempoolTxs() {
        return Promise.resolve();
    }
}
