import { asNetworkSymbol } from '@suite-common/wallet-config';

import { mockTransaction } from '../../mocks/mockTransaction';
import { testCreateTransactionStoreSqlite } from '../../mocks/testCreateTransactionStoreSqlite';
import { migrateTransactionStoreSchema } from '../schema/migrateTransactionStoreSchema';
import type { TransactionStoreAccount } from '../transactionStoreTypes';
import { createTransactionRepository } from './createTransactionRepository';

const btcAccount: TransactionStoreAccount = {
    accountKey: 'btc-account',
    symbol: asNetworkSymbol('btc'),
    descriptor: 'xpub-btc',
};
const ethAccount: TransactionStoreAccount = {
    accountKey: 'eth-account',
    symbol: asNetworkSymbol('eth'),
    descriptor: '0xeth',
};

const setUp = async () => {
    const sqlite = await testCreateTransactionStoreSqlite();
    migrateTransactionStoreSchema({ sqlite });
    const repository = createTransactionRepository({ sqlite });
    repository.replaceAccounts([btcAccount, ethAccount]);

    return { sqlite, repository };
};

describe(createTransactionRepository.name, () => {
    it('keeps the accounts of each network', async () => {
        const { sqlite, repository } = await setUp();

        expect(repository.selectAccount('eth-account')).toEqual(ethAccount);
        expect(repository.selectAccount('unknown')).toBeUndefined();
        sqlite.dispose();
    });

    it('lists the newest transactions first, the pending ones above all', async () => {
        const { sqlite, repository } = await setUp();
        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [
                mockTransaction({ txid: 'old', blockHeight: 1, blockTime: 1000 }),
                mockTransaction({ txid: 'pending', blockHeight: undefined, blockTime: 1500 }),
                mockTransaction({ txid: 'new', blockHeight: 2, blockTime: 2000 }),
            ],
        });

        const transactions = repository.selectTransactions({ accountKeys: ['btc-account'] });

        expect(transactions.map(({ txid }) => txid)).toEqual(['pending', 'new', 'old']);
        expect(transactions[0]).toEqual({
            accountKey: 'btc-account',
            txid: 'pending',
            blockHeight: null,
            blockTime: 1500,
            transaction: mockTransaction({
                txid: 'pending',
                blockHeight: undefined,
                blockTime: 1500,
            }),
        });
        sqlite.dispose();
    });

    it('pages the list', async () => {
        const { sqlite, repository } = await setUp();
        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [1, 2, 3].map(height =>
                mockTransaction({ txid: `tx${height}`, blockHeight: height, blockTime: height }),
            ),
        });

        const page = repository.selectTransactions({
            accountKeys: ['btc-account'],
            limit: 1,
            offset: 1,
        });

        expect(page.map(({ txid }) => txid)).toEqual(['tx2']);
        sqlite.dispose();
    });

    it('updates a transaction once it is mined, instead of storing it twice', async () => {
        const { sqlite, repository } = await setUp();
        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [mockTransaction({ txid: 'tx', blockHeight: undefined })],
        });

        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [mockTransaction({ txid: 'tx', blockHeight: 7 })],
        });

        expect(repository.selectTransactions({ accountKeys: ['btc-account'] })).toMatchObject([
            { txid: 'tx', blockHeight: 7 },
        ]);
        sqlite.dispose();
    });

    it('counts only the transactions that are new or changed', async () => {
        const { sqlite, repository } = await setUp();
        const pending = mockTransaction({ txid: 'pending', blockHeight: undefined });
        const mined = mockTransaction({ txid: 'mined', blockHeight: 3 });
        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [pending, mined],
        });

        const changes = repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [{ ...pending, blockHeight: 4 }, mined],
        });

        expect(changes).toBe(1);
        sqlite.dispose();
    });

    it('tells which of the transactions it already holds', async () => {
        const { sqlite, repository } = await setUp();
        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [mockTransaction({ txid: 'known' })],
        });

        const stored = repository.selectStoredTxids({
            accountKey: 'btc-account',
            txids: ['known', 'unknown'],
        });

        expect([...stored]).toEqual(['known']);
        sqlite.dispose();
    });

    it("tracks an account's sync state", async () => {
        const { sqlite, repository } = await setUp();
        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [
                mockTransaction({ txid: 'a', blockHeight: 5 }),
                mockTransaction({ txid: 'b', blockHeight: 9 }),
            ],
        });

        repository.updateSyncState({
            accountKey: 'btc-account',
            isComplete: true,
            lastSyncedAt: 1234,
            lastError: null,
        });

        expect(repository.selectSyncState('btc-account')).toEqual({
            isComplete: true,
            lastSyncedAt: 1234,
            lastError: null,
        });
        expect(repository.selectSyncState('eth-account')).toEqual({
            isComplete: false,
            lastSyncedAt: null,
            lastError: null,
        });
        sqlite.dispose();
    });

    it("forgets an account's transactions and state along with it", async () => {
        const { sqlite, repository } = await setUp();
        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [mockTransaction({ txid: 'tx' })],
        });
        repository.updateSyncState({
            accountKey: 'btc-account',
            isComplete: true,
            lastSyncedAt: 1,
            lastError: null,
        });

        repository.replaceAccounts([ethAccount]);

        expect(repository.selectAccount('btc-account')).toBeUndefined();
        expect(repository.selectTransactions({ accountKeys: ['btc-account'] })).toEqual([]);
        expect(repository.selectSyncState('btc-account').isComplete).toBe(false);
        sqlite.dispose();
    });

    it('lists the transactions moving one asset: a token, or the coin', async () => {
        const { sqlite, repository } = await setUp();
        const usdc = '0xusdc';
        repository.upsertTransactions({
            accountKey: 'eth-account',
            transactions: [
                mockTransaction({ txid: 'coin', amount: '5', blockTime: 3 }),
                mockTransaction({
                    txid: 'token',
                    amount: '0',
                    blockTime: 2,
                    tokens: [
                        {
                            type: 'recv',
                            standard: 'ERC20',
                            amount: '100',
                            from: '0xfrom',
                            to: '0xeth',
                            contract: usdc,
                            symbol: 'USDC',
                            decimals: 6,
                        },
                    ],
                }),
                mockTransaction({
                    txid: 'internal',
                    amount: '0',
                    blockTime: 1,
                    internalTransfers: [{ type: 'recv', amount: '7', from: '0xa', to: '0xeth' }],
                }),
            ],
        });

        const byContract = (contract: string | null) =>
            repository
                .selectTransactions({ accountKeys: ['eth-account'], contract })
                .map(({ txid }) => txid);

        expect(byContract(usdc)).toEqual(['token']);
        expect(byContract(null)).toEqual(['coin', 'internal']);
        expect(repository.countTransactions({ accountKeys: ['eth-account'], contract: usdc })).toBe(
            1,
        );
        expect(repository.countTransactions({ accountKeys: ['eth-account'] })).toBe(3);
        expect(
            sqlite.exec({
                sql: 'SELECT kind, contract, direction, amount, decimals FROM transfers WHERE txid = ?',
                parameters: ['token'],
            }).rows,
        ).toEqual([
            { kind: 'token', contract: usdc, direction: 'recv', amount: '100', decimals: 6 },
        ]);
        sqlite.dispose();
    });

    it("rewrites a transaction's transfers when it changes, and drops them with it", async () => {
        const { sqlite, repository } = await setUp();
        const countTransfers = () =>
            sqlite.exec({ sql: 'SELECT COUNT(*) AS count FROM transfers', parameters: [] }).rows;
        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [mockTransaction({ txid: 'tx', blockHeight: undefined })],
        });

        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [mockTransaction({ txid: 'tx', blockHeight: 9 })],
        });

        expect(countTransfers()).toEqual([{ count: 1 }]);
        expect(
            sqlite.exec({
                sql: 'SELECT block_height FROM transfers WHERE txid = ?',
                parameters: ['tx'],
            }).rows,
        ).toEqual([{ block_height: 9 }]);

        repository.replaceAccounts([ethAccount]);

        expect(countTransfers()).toEqual([{ count: 0 }]);
        sqlite.dispose();
    });

    it('keeps exactly the given accounts, deleting the others with their history', async () => {
        const { sqlite, repository } = await setUp();
        repository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: [mockTransaction({ txid: 'tx' })],
        });
        const ltcAccount: TransactionStoreAccount = {
            accountKey: 'ltc-account',
            symbol: asNetworkSymbol('ltc'),
            descriptor: 'xpub-ltc',
        };

        const result = repository.replaceAccounts([ethAccount, ltcAccount]);

        expect(result).toEqual({ removedAccountKeys: ['btc-account'] });
        expect(repository.selectAccount('btc-account')).toBeUndefined();
        expect(repository.selectAccount('ltc-account')).toEqual(ltcAccount);
        expect(
            sqlite.exec({
                sql: 'SELECT (SELECT COUNT(*) FROM transactions) + (SELECT COUNT(*) FROM transfers) AS count',
                parameters: [],
            }).rows,
        ).toEqual([{ count: 0 }]);
        sqlite.dispose();
    });
});
