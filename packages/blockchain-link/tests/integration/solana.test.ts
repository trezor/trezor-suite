import { AccountInfoParams } from '@trezor/blockchain-link-types';
import BlockchainLink from '../../lib';
import SolanaWorker, { SolanaAPI } from '../../lib/workers/solana';

const id = 79;
const descriptor = '2MLmmoKgCrxVEzMeGatnjdABYS5RXsQSNikcWrmnvQna';
const balance = '1000000000';

const fixtures = {
    accountInfoRequest: [
        {
            name: 'basic',
            input: {
                id,
                descriptor,
                details: 'basic',
            },
            result: {
                descriptor,
                balance,
                availableBalance: balance,
                empty: false,
                history: {
                    total: 1,
                    unconfirmed: 0,
                    transactions: undefined,
                    txids: ['deadbeaf'],
                },
                page: undefined,
            },
        },
        {
            name: 'txIds',
            input: {
                id,
                descriptor,
                details: 'txIds',
            },
            result: {
                descriptor,
                balance,
                availableBalance: balance,
                empty: false,
                history: {
                    total: 1,
                    unconfirmed: 0,
                    transactions: undefined,
                    txids: ['deadbeaf'],
                },
                page: undefined,
            },
        },
        {
            name: 'txs',
            input: {
                id,
                descriptor,
                details: 'txs',
            },
            result: {
                descriptor,
                balance,
                availableBalance: balance,
                empty: false,
                history: {
                    total: 1,
                    unconfirmed: 0,
                    transactions: [
                        {
                            type: 'self',
                            txid: 'deadbeaf',
                            blockTime: 1631753600,
                            amount: '20',
                            fee: '20',
                            targets: [
                                {
                                    n: 0,
                                    addresses: [descriptor],
                                    isAddress: true,
                                    amount: '20',
                                    isAccountTarget: true,
                                },
                            ],
                            tokens: [],
                            internalTransfers: [],
                            details: {
                                size: 0,
                                totalInput: '20',
                                totalOutput: '0',
                                vin: [
                                    {
                                        txid: 'deadbeaf',
                                        version: 'legacy',
                                        isAddress: true,
                                        isAccountOwned: true,
                                        n: 0,
                                        value: '20',
                                        addresses: [descriptor],
                                    },
                                ],
                                vout: [],
                            },
                            blockHeight: 195138557,
                        },
                    ],
                    txids: ['deadbeaf'],
                },
                page: { total: 1, index: 0, size: 1 },
            },
        },
    ],
};

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
    getAccountInfo: () => ({
        address: descriptor,
        lamports: {
            toString: () => balance,
        },
    }),
    getSignaturesForAddress: () => [
        {
            signature: 'deadbeaf',
            slot: 1,
            err: null,
            memo: null,
            confirmationStatus: 'confirmed',
        },
    ],
    getParsedTransactions: () => [
        {
            meta: {
                preBalances: [200],
                postBalances: [180],
                fee: 20,
            },
            transaction: {
                signatures: ['deadbeaf'],
                message: {
                    accountKeys: [{ pubkey: { toString: () => descriptor } }],
                    instructions: [
                        {
                            parsed: {
                                type: 'transfer',
                            },
                        },
                    ],
                },
            },
            version: 'legacy',
            blockTime: 1631753600,
            slot: 5,
        },
    ],
} as unknown as SolanaAPI;

describe(`Solana`, () => {
    let blockchain: BlockchainLink;

    const worker = SolanaWorker();

    worker.tryConnect = () => Promise.resolve(solanaApi);

    beforeAll(() => {
        blockchain = new BlockchainLink({
            name: 'Solana',
            worker: () => worker,
            server: ['dummyUrl'],
            debug: false,
        });
    });

    afterAll(() => {
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

    fixtures.accountInfoRequest.forEach(f =>
        it(`Get account info ${f.name}`, async () => {
            const result = await blockchain.getAccountInfo(f.input as AccountInfoParams);
            expect(result).toEqual(f.result);
        }),
    );
});
