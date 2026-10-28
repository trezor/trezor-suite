import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { AccountInfo } from '@trezor/blockchain-link-types';
import { createMockDeps, mock } from '@trezor/dependency-injection';

import { mockTransaction } from '../../mocks/mockTransaction';
import type { TransactionStoreAccount } from '../transactionStoreTypes';
import {
    type BlockchainLinkClient,
    type BlockchainLinkTransactionSourceDeps,
    createBlockchainLinkTransactionSource,
} from './createBlockchainLinkTransactionSource';

const btc = asNetworkSymbol('btc');

const account: TransactionStoreAccount = {
    accountKey: 'btc-account',
    symbol: btc,
    descriptor: 'xpub',
};

const mockAccountInfo = (accountInfo: Partial<AccountInfo>): AccountInfo => ({
    descriptor: 'xpub',
    balance: '0',
    availableBalance: '0',
    empty: false,
    history: { total: 0, unconfirmed: 0 },
    ...accountInfo,
});

const mockClient = (getAccountInfo: BlockchainLinkClient['getAccountInfo']) => ({
    getAccountInfo: mock(getAccountInfo),
});

const createSource = (client: BlockchainLinkClient | undefined) => {
    const deps = createMockDeps<BlockchainLinkTransactionSourceDeps>({
        pageSize: 25,
        getBlockchainLink: () => client,
    });

    return { deps, source: createBlockchainLinkTransactionSource(deps) };
};

describe(createBlockchainLinkTransactionSource.name, () => {
    it("asks the network's backend for a page of the account's history", async () => {
        const fullPage = Array.from({ length: 25 }, (_, index) =>
            mockTransaction({ txid: `tx${index}` }),
        );
        const client = mockClient(() =>
            Promise.resolve(
                mockAccountInfo({
                    history: { total: 60, unconfirmed: 0, transactions: fullPage },
                    page: { index: 2, size: 25, total: 3 },
                }),
            ),
        );
        const { deps, source } = createSource(client);

        const result = await source.fetchTransactionsPage({ account, page: 2 });

        expect(deps.getBlockchainLink).toHaveBeenCalledWith(btc);
        expect(client.getAccountInfo).toHaveBeenCalledWith({
            descriptor: 'xpub',
            details: 'txs',
            page: 2,
            pageSize: 25,
        });
        expect(result).toEqual({
            success: true,
            payload: { transactions: fullPage, hasNextPage: true },
        });
    });

    it("takes a short page as the end of history, though Solana's page says there is more", async () => {
        const { source } = createSource(
            mockClient(() =>
                Promise.resolve(
                    mockAccountInfo({
                        history: {
                            total: 3,
                            unconfirmed: 0,
                            transactions: [mockTransaction({ txid: 'a' })],
                        },
                        // Solana's: the page index from 0, the total in transactions.
                        page: { index: 0, size: 1, total: 3 },
                    }),
                ),
            ),
        );

        expect(await source.fetchTransactionsPage({ account, page: 1 })).toEqual({
            success: true,
            payload: { transactions: [mockTransaction({ txid: 'a' })], hasNextPage: false },
        });
    });

    it('takes the last page as the end of history', async () => {
        const { source } = createSource(
            mockClient(() =>
                Promise.resolve(mockAccountInfo({ page: { index: 3, size: 25, total: 3 } })),
            ),
        );

        expect(await source.fetchTransactionsPage({ account, page: 3 })).toEqual({
            success: true,
            payload: { transactions: [], hasNextPage: false },
        });
    });

    it('takes a backend without pages as answering with the whole history', async () => {
        const { source } = createSource(mockClient(() => Promise.resolve(mockAccountInfo({}))));

        expect(await source.fetchTransactionsPage({ account, page: 1 })).toEqual({
            success: true,
            payload: { transactions: [], hasNextPage: false },
        });
    });

    it("reports the backend's failure by its type, never by its message", async () => {
        const { source } = createSource(
            mockClient(() => Promise.reject(new Error('Address xpub not found'))),
        );

        expect(await source.fetchTransactionsPage({ account, page: 1 })).toEqual({
            success: false,
            error: 'BackendError',
        });
    });

    it('reports a network it has no backend for as unavailable', async () => {
        const { source } = createSource(undefined);

        expect(await source.fetchTransactionsPage({ account, page: 1 })).toEqual({
            success: false,
            error: 'BackendUnavailable',
        });
    });
});
