// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { NotFoundError } from '@trezor/network-stellar';

import { BlockchainLink } from '../../index';

import StellarWorker from './index';

jest.mock('@trezor/blockchain-link-utils/src/stellar', () => ({
    ...jest.requireActual('@trezor/blockchain-link-utils/src/stellar'),
    getTokenMetadata: () => Promise.resolve({}),
}));

const mockState: {
    accountError?: unknown;
    transactionsError?: unknown;
} = {};

const mockNotFoundError = () => new NotFoundError('Not Found', { status: 404 });

const mockAccount = {
    sequence: '123456',
    subentry_count: 0,
    num_sponsoring: 0,
    num_sponsored: 0,
    balances: [{ asset_type: 'native', balance: '3.3580137', selling_liabilities: '0' }],
};

jest.mock('@trezor/network-stellar/runtime', () => ({
    __esModule: true,
    default: () => {
        const actual = jest.requireActual('@trezor/network-stellar');

        return Promise.resolve({
            ...actual,
            getStellarConnection: () =>
                Promise.resolve({
                    api: {
                        accounts: () => ({
                            accountId: () => ({
                                call: () => {
                                    if (mockState.accountError) throw mockState.accountError;

                                    return Promise.resolve(mockAccount);
                                },
                            }),
                        }),
                        transactions: () => {
                            const builder = {
                                forAccount: () => builder,
                                includeFailed: () => builder,
                                limit: () => builder,
                                order: () => builder,
                                cursor: () => builder,
                                call: () => {
                                    if (mockState.transactionsError) {
                                        throw mockState.transactionsError;
                                    }

                                    return Promise.resolve({ records: [] });
                                },
                            };

                            return builder;
                        },
                    },
                    isTestnet: false,
                }),
        });
    },
}));

describe('Stellar worker error handling', () => {
    let blockchain: BlockchainLink;

    beforeEach(() => {
        mockState.accountError = undefined;
        mockState.transactionsError = undefined;
        blockchain = new BlockchainLink({
            name: 'Stellar',
            worker: StellarWorker,
            server: ['https://mocked'],
            debug: false,
        });
    });

    afterEach(() => {
        blockchain.dispose();
    });

    it('history not found is returned as an empty transaction list', async () => {
        mockState.transactionsError = mockNotFoundError();
        const result = await blockchain.getAccountInfo({ descriptor: 'A', details: 'txs' });
        expect(result.empty).toBe(false);
        expect(result.balance).toBe('33580137');
        expect(result.history.transactions).toEqual([]);
        expect(result.stellarCursor).toBeUndefined();
    });

    it('history fetch failure is rethrown', async () => {
        mockState.transactionsError = new Error('Internal Server Error');
        await expect(
            blockchain.getAccountInfo({ descriptor: 'A', details: 'txs' }),
        ).rejects.toThrow('Internal Server Error');
    });

    it('account not found is returned as an empty account', async () => {
        mockState.accountError = mockNotFoundError();
        const result = await blockchain.getAccountInfo({ descriptor: 'A', details: 'txs' });
        expect(result.empty).toBe(true);
        expect(result.balance).toBe('0');
    });

    it('account fetch failure is rethrown', async () => {
        mockState.accountError = new Error('Too Many Requests');
        await expect(
            blockchain.getAccountInfo({ descriptor: 'A', details: 'txs' }),
        ).rejects.toThrow('Too Many Requests');
    });
});
