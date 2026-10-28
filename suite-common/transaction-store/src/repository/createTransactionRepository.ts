import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { Transaction } from '@trezor/blockchain-link-types';
import { type Result, err, ok } from '@trezor/type-utils';

import { runInSqliteTransaction } from '../sqlite/runInSqliteTransaction';
import type {
    SqlQuery,
    SqlRow,
    SqlValue,
    TransactionStoreSqliteDep,
} from '../sqlite/transactionStoreSqlite';
import type {
    StoredTransaction,
    TransactionSourceErrorType,
    TransactionStoreAccount,
} from '../transactionStoreTypes';

export type TransactionRepositoryDeps = TransactionStoreSqliteDep;

export type SelectTransactionsParams = {
    accountKeys: string[];
    limit?: number;
    offset?: number;
};

export type SyncState = {
    isComplete: boolean;
    newestBlockHeight: number | null;
    lastSyncedAt: number | null;
    lastError: TransactionSourceErrorType | null;
};

export type SelectRowsError = { type: 'QueryFailed' };

export type TransactionRepository = {
    upsertAccounts: (accounts: TransactionStoreAccount[]) => void;
    removeAccounts: (accountKeys: string[]) => void;
    selectAccount: (accountKey: string) => TransactionStoreAccount | undefined;
    selectAccounts: (params: { symbol?: NetworkSymbol }) => TransactionStoreAccount[];
    /** Returns how many rows were added or actually changed. */
    upsertTransactions: (params: { accountKey: string; transactions: Transaction[] }) => number;
    selectStoredTxids: (params: { accountKey: string; txids: string[] }) => Set<string>;
    selectTransactions: (params: SelectTransactionsParams) => StoredTransaction[];
    selectSyncState: (accountKey: string) => SyncState;
    updateSyncState: (
        params: { accountKey: string } & Omit<SyncState, 'newestBlockHeight'>,
    ) => void;
    /** Any read-only statement; writes are refused by SQLite itself. */
    selectRows: (query: SqlQuery) => Result<ReadonlyArray<SqlRow>, SelectRowsError>;
};

export type TransactionRepositoryDep = { transactionRepository: TransactionRepository };

type AccountRow = { account_key: string; symbol: string; descriptor: string };

type TransactionRow = {
    account_key: string;
    txid: string;
    block_height: number | null;
    block_time: number | null;
    data: string;
};

type SyncStateRow = {
    is_complete: number;
    last_synced_at: number | null;
    last_error: string | null;
    newest_block_height: number | null;
};

const toPlaceholders = (values: ReadonlyArray<unknown>) => values.map(() => '?').join(', ');

const toAccount = (row: AccountRow): TransactionStoreAccount => ({
    accountKey: row.account_key,
    // Written only from `TransactionStoreAccount`, so it is a network symbol.
    symbol: row.symbol as NetworkSymbol,
    descriptor: row.descriptor,
});

const toBlockHeight = (transaction: Transaction) =>
    transaction.blockHeight !== undefined && transaction.blockHeight > 0
        ? transaction.blockHeight
        : null;

export const createTransactionRepository = (
    deps: TransactionRepositoryDeps,
): TransactionRepository => {
    const exec = <TRow extends SqlRow>(sql: string, parameters: ReadonlyArray<SqlValue> = []) =>
        deps.sqlite.exec<TRow>({ sql, parameters });

    return {
        upsertAccounts: accounts =>
            runInSqliteTransaction(deps.sqlite, () =>
                accounts.forEach(account =>
                    exec(
                        `INSERT INTO accounts (account_key, symbol, descriptor) VALUES (?, ?, ?)
                        ON CONFLICT (account_key) DO UPDATE
                        SET symbol = excluded.symbol, descriptor = excluded.descriptor`,
                        [account.accountKey, account.symbol, account.descriptor],
                    ),
                ),
            ),

        removeAccounts: accountKeys => {
            exec(
                `DELETE FROM accounts WHERE account_key IN (${toPlaceholders(accountKeys)})`,
                accountKeys,
            );
        },

        selectAccount: accountKey => {
            const row = exec<AccountRow>(
                'SELECT account_key, symbol, descriptor FROM accounts WHERE account_key = ?',
                [accountKey],
            ).rows[0];

            return row === undefined ? undefined : toAccount(row);
        },

        selectAccounts: ({ symbol }) =>
            (symbol === undefined
                ? exec<AccountRow>(
                      'SELECT account_key, symbol, descriptor FROM accounts ORDER BY account_key',
                  )
                : exec<AccountRow>(
                      `SELECT account_key, symbol, descriptor FROM accounts WHERE symbol = ?
                      ORDER BY account_key`,
                      [symbol],
                  )
            ).rows.map(toAccount),

        upsertTransactions: ({ accountKey, transactions }) =>
            runInSqliteTransaction(deps.sqlite, () =>
                transactions.reduce(
                    (changes, transaction) =>
                        changes +
                        exec(
                            // An unchanged row is not rewritten, so it does not count as a change
                            // and a block does not make every list refetch.
                            `INSERT INTO transactions
                                (account_key, txid, block_height, block_time, type, data)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ON CONFLICT (account_key, txid) DO UPDATE SET
                                block_height = excluded.block_height,
                                block_time = excluded.block_time,
                                type = excluded.type,
                                data = excluded.data
                            WHERE data IS NOT excluded.data`,
                            [
                                accountKey,
                                transaction.txid,
                                toBlockHeight(transaction),
                                transaction.blockTime ?? null,
                                transaction.type,
                                JSON.stringify(transaction),
                            ],
                        ).changes,
                    0,
                ),
            ),

        selectStoredTxids: ({ accountKey, txids }) =>
            new Set(
                txids.length === 0
                    ? []
                    : exec<{ txid: string }>(
                          `SELECT txid FROM transactions
                          WHERE account_key = ? AND txid IN (${toPlaceholders(txids)})`,
                          [accountKey, ...txids],
                      ).rows.map(row => row.txid),
            ),

        selectTransactions: ({ accountKeys, limit = -1, offset = 0 }) =>
            exec<TransactionRow>(
                `SELECT account_key, txid, block_height, block_time, data FROM transactions
                WHERE account_key IN (${toPlaceholders(accountKeys)})
                ORDER BY block_height IS NULL DESC, block_time DESC, txid
                LIMIT ? OFFSET ?`,
                [...accountKeys, limit, offset],
            ).rows.map(row => ({
                accountKey: row.account_key,
                txid: row.txid,
                blockHeight: row.block_height,
                blockTime: row.block_time,
                transaction: JSON.parse(row.data),
            })),

        selectSyncState: accountKey => {
            const row = exec<SyncStateRow>(
                `SELECT
                    COALESCE(s.is_complete, 0) AS is_complete,
                    s.last_synced_at,
                    s.last_error,
                    (SELECT MAX(block_height) FROM transactions t WHERE t.account_key = ?)
                        AS newest_block_height
                FROM (SELECT ? AS account_key) k
                LEFT JOIN sync_state s ON s.account_key = k.account_key`,
                [accountKey, accountKey],
            ).rows[0];

            return {
                isComplete: row?.is_complete === 1,
                newestBlockHeight: row?.newest_block_height ?? null,
                lastSyncedAt: row?.last_synced_at ?? null,
                // Written only from `TransactionSourceErrorType`.
                lastError: (row?.last_error ?? null) as TransactionSourceErrorType | null,
            };
        },

        updateSyncState: ({ accountKey, isComplete, lastSyncedAt, lastError }) => {
            exec(
                `INSERT INTO sync_state (account_key, is_complete, last_synced_at, last_error)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (account_key) DO UPDATE SET
                    is_complete = excluded.is_complete,
                    last_synced_at = excluded.last_synced_at,
                    last_error = excluded.last_error`,
                [accountKey, isComplete ? 1 : 0, lastSyncedAt, lastError],
            );
        },

        selectRows: query => {
            exec('PRAGMA query_only = ON');
            try {
                return ok(deps.sqlite.exec(query).rows);
            } catch {
                // A malformed query or a write: the caller's mistake, which it gets told about.
                return err({ type: 'QueryFailed' });
            } finally {
                exec('PRAGMA query_only = OFF');
            }
        },
    };
};
