import BlockchainLink from '../../lib';
import SolanaWorker, { SolanaAPI } from '../../lib/workers/solana';

export const solanaApi = {
    getGenesisHash: () => '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
    getVersion: () => ({ 'feature-set': 1879391783, 'solana-core': '1.14.22' }),
    getParsedBlock: () => ({
        blockHeight: 195138557,
        blockTime: 1684668753,
        blockhash: '9Grw2oA6XBQ499EmBKJfyjhwATojKGupGhjWQiCWhpxB',
        parentSlot: 195138556,
        previousBlockhash: '2K6J2Nw3z4P9SsGTq2n33YvqByrn826zjMsLqXz3f3Yh',
        rewards: [],
        transactions: [],
    }),
    getBlockHeight: () => 195138557,
    rpcEndpoint: 'dummyUrl',
} as unknown as SolanaAPI;

describe(`Solana`, () => {
    let blockchain: BlockchainLink;

    const worker = SolanaWorker();

    worker.tryConnect = () => Promise.resolve(solanaApi);

    beforeEach(() => {
        blockchain = new BlockchainLink({
            name: 'Solana',
            worker: () => worker,
            server: ['dummyUrl'],
            debug: false,
        });
    });

    afterEach(() => {
        blockchain.dispose();
    });

    it('Get info', async () => {
        const result = await blockchain.getInfo();
        expect(result).toEqual({
            testnet: false,
            blockHeight: 195138557,
            blockHash: '9Grw2oA6XBQ499EmBKJfyjhwATojKGupGhjWQiCWhpxB',
            shortcut: 'sol',
            url: expect.any(String),
            name: 'Solana',
            version: '1.14.22',
            decimals: 9,
        });
    });
});
