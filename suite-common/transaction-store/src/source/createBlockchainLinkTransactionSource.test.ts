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
    subscribe: mock<BlockchainLinkClient['subscribe']>(() => Promise.resolve()),
    unsubscribe: mock<BlockchainLinkClient['unsubscribe']>(() => Promise.resolve()),
    on: mock<BlockchainLinkClient['on']>(),
    off: mock<BlockchainLinkClient['off']>(),
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
        const client = mockClient(() =>
            Promise.resolve(
                mockAccountInfo({
                    history: {
                        total: 60,
                        unconfirmed: 0,
                        transactions: [mockTransaction({ txid: 'a' })],
                    },
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
            payload: { transactions: [mockTransaction({ txid: 'a' })], hasNextPage: true },
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
        expect(await source.subscribeBlocks({ symbol: btc, onBlock: () => {} })).toEqual({
            success: false,
            error: 'BackendUnavailable',
        });
    });

    it('calls back on every block until unsubscribed', async () => {
        const client = mockClient(() => Promise.resolve(mockAccountInfo({})));
        const onBlock = mock<() => void>();
        const { source } = createSource(client);

        const result = await source.subscribeBlocks({ symbol: btc, onBlock });
        const [event, listener] = client.on.mock.calls[0] ?? [];
        listener?.({ blockHeight: 1, blockHash: 'hash' });

        expect(client.subscribe).toHaveBeenCalledWith({ type: 'block' });
        expect(event).toBe('block');
        expect(onBlock).toHaveBeenCalledTimes(1);
        expect(result.success).toBe(true);

        if (result.success) result.payload();

        expect(client.off).toHaveBeenCalledWith('block', listener);
        expect(client.unsubscribe).toHaveBeenCalledWith({ type: 'block' });
    });

    it('reports a block subscription the backend refused', async () => {
        const client = mockClient(() => Promise.resolve(mockAccountInfo({})));
        client.subscribe.mockRejectedValue(new Error('Disconnected'));
        const { source } = createSource(client);

        expect(await source.subscribeBlocks({ symbol: btc, onBlock: () => {} })).toEqual({
            success: false,
            error: 'BackendError',
        });
        expect(client.on).not.toHaveBeenCalled();
    });
});
