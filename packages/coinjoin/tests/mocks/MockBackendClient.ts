import { CoinjoinBackendClient } from '../../src/backend/CoinjoinBackendClient';

type MockEndpoint = ReturnType<InstanceType<typeof CoinjoinBackendClient>['request']>;

type TransactionFixture = {
    txid: string;
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
        super({ blockbookUrls: ['foo'], coordinatorUrl: 'bar' });
        this.blocks = [];
        this.mempool = [];
        this.transactions = [];
    }

    private blocks: BlockFixture[];
    private mempool: TransactionFixture[];
    private transactions: TransactionFixture[];

    setFixture(blocks: BlockFixture[], mempool: { txid: string }[] = []) {
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

    protected wabisabi(): MockEndpoint {
        const parseGet = (
            path: string,
            { bestKnownBlockHash, count }: Record<string, any> = {},
        ) => {
            switch (path) {
                case 'Blockchain/mempool-hashes':
                    return this.mockResponse(
                        200,
                        this.mempool.map(({ txid }) => txid),
                    );
                case 'Blockchain/filters': {
                    if (typeof bestKnownBlockHash !== 'string') this.mockResponse(404);
                    if (typeof count !== 'number') return this.mockResponse(404);
                    if (this.blocks[this.blocks.length - 1].hash === bestKnownBlockHash)
                        return this.mockResponse(204);
                    const from = this.blocks.findIndex(
                        ({ previousBlockHash }) => previousBlockHash === bestKnownBlockHash,
                    );
                    if (from < 0) return this.mockResponse(404);
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
                default:
                    return this.mockResponse(404);
            }
        };
        return {
            get: parseGet,
            post: () => this.mockResponse(404),
        };
    }

    protected blockbook(): MockEndpoint {
        const parseGet = (path: string) => {
            const [what, which] = path.split('/');
            switch (what) {
                case 'tx': {
                    const tx = this.transactions.find(t => t.txid === which);
                    return tx ? this.mockResponse(200, tx) : this.mockResponse(404);
                }
                case 'block': {
                    const height = parseInt(which, 10);
                    const block = this.blocks.find(b => b.height === height);
                    return block ? this.mockResponse(200, block) : this.mockResponse(404);
                }
                default:
                    return this.mockResponse(404);
            }
        };
        return {
            get: parseGet,
            post: () => this.mockResponse(404),
        };
    }
}
