import {
    type NetworkSymbol,
    type NetworkType,
    getNetworkDecimals,
    getNetworkType,
} from '@suite-common/wallet-config';
import type { Transaction } from '@trezor/blockchain-link-types';

import { toTransactionSearchClause } from '../search/toTransactionSearchClause';
import { runInSqliteTransaction } from '../sqlite/runInSqliteTransaction';
import type { SqlRow, SqlValue, TransactionStoreSqliteDep } from '../sqlite/transactionStoreSqlite';
import { toSuspiciousClause } from '../suspicious/toSuspiciousClause';
import type {
    KnownTokens,
    StoredTransaction,
    SuspiciousTransactionsContext,
    TransactionSourceErrorType,
    TransactionStoreAccount,
} from '../transactionStoreTypes';
import { flattenTransfers } from './flattenTransfers';
import type { TransactionSearch } from '../search/transactionSearch';

export type TransactionRepositoryDeps = TransactionStoreSqliteDep;

export type TransactionsFilter = {
    accountKeys: string[];
    /**
     * Only transactions moving this asset: a token's contract, or `null` for the network's own
     * coin. Left out, every transaction.
     */
    contract?: string | null;
    /** Only the transactions the search matches, run in SQL here; see `parseTransactionSearch`. */
    search?: TransactionSearch;
    /** Without the suspicious ones, decided in SQL from what the app fed; see `toSuspiciousClause`. */
    hideSuspicious?: SuspiciousTransactionsContext;
};

export type SelectTransactionsParams = TransactionsFilter & {
    limit?: number;
    offset?: number;
};

export type SyncState = {
    isComplete: boolean;
    lastSyncedAt: number | null;
    lastError: TransactionSourceErrorType | null;
};

export type ReplaceAccountsResult = { removedAccountKeys: string[] };

export type TransactionRepository = {
    /**
     * Makes the stored accounts exactly these: upserts them, and deletes every other stored
     * account with its whole history, in one SQLite transaction.
     */
    replaceAccounts: (accounts: TransactionStoreAccount[]) => ReplaceAccountsResult;
    selectAccount: (accountKey: string) => TransactionStoreAccount | undefined;
    selectAccountKeys: (params: { symbols: NetworkSymbol[] }) => string[];
    /** Makes the network's known tokens exactly these; `null` lists forget its definitions. */
    replaceKnownTokens: (knownTokens: KnownTokens) => void;
    /** Returns how many rows were added or actually changed. */
    upsertTransactions: (params: { accountKey: string; transactions: Transaction[] }) => number;
    selectStoredTxids: (params: { accountKey: string; txids: string[] }) => Set<string>;
    selectTransactions: (params: SelectTransactionsParams) => StoredTransaction[];
    countTransactions: (filter: TransactionsFilter) => number;
    selectSyncState: (accountKey: string) => SyncState;
    /** The accounts the store has synced or tried to, i.e. the ones someone has asked for. */
    selectTrackedAccountKeys: (accountKeys: string[]) => string[];
    updateSyncState: (params: { accountKey: string } & SyncState) => void;
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

const toContractClause = (contract: string | null) => ({
    // `IS` matches `NULL` too, so the same clause serves the coin and a token.
    sql: `EXISTS (
        SELECT 1 FROM transfers f
        WHERE f.account_key = t.account_key AND f.txid = t.txid AND f.contract IS ?
    )`,
    parameters: [contract],
});

/** The `WHERE` of transactions passing the filter, aliased `t`, and its parameters. */
const toFilterClause = (
    { accountKeys, contract, search, hideSuspicious }: TransactionsFilter,
    groupAccountKeysByNetworkType: (accountKeys: string[]) => Map<NetworkType, string[]>,
) => {
    const clauses = [
        { sql: `t.account_key IN (${toPlaceholders(accountKeys)})`, parameters: accountKeys },
        ...(contract === undefined ? [] : [toContractClause(contract)]),
        ...(search === undefined ? [] : [toTransactionSearchClause(search)]),
        ...(hideSuspicious === undefined
            ? []
            : [toSuspiciousClause(hideSuspicious, groupAccountKeysByNetworkType(accountKeys))]),
    ];

    return {
        where: clauses.map(clause => clause.sql).join(' AND '),
        parameters: clauses.flatMap((clause): SqlValue[] => clause.parameters),
    };
};

export const createTransactionRepository = (
    deps: TransactionRepositoryDeps,
): TransactionRepository => {
    const exec = <TRow extends SqlRow>(sql: string, parameters: ReadonlyArray<SqlValue> = []) =>
        deps.sqlite.exec<TRow>({ sql, parameters });

    const replaceTransfers = (
        accountKey: string,
        transaction: Transaction,
        networkDecimals: number | undefined,
    ) => {
        exec('DELETE FROM transfers WHERE account_key = ? AND txid = ?', [
            accountKey,
            transaction.txid,
        ]);
        flattenTransfers(transaction, networkDecimals).forEach(transfer =>
            exec(
                `INSERT INTO transfers (
                    account_key, txid, idx, kind, contract, direction, amount, value, decimals,
                    symbol, standard, from_address, to_address, block_height, block_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    accountKey,
                    transaction.txid,
                    transfer.idx,
                    transfer.kind,
                    transfer.contract,
                    transfer.direction,
                    transfer.amount,
                    transfer.value,
                    transfer.decimals,
                    transfer.symbol,
                    transfer.standard,
                    transfer.fromAddress,
                    transfer.toAddress,
                    toBlockHeight(transaction),
                    transaction.blockTime ?? null,
                ],
            ),
        );
    };

    const upsertAccount = (account: TransactionStoreAccount) =>
        exec(
            `INSERT INTO accounts (account_key, symbol, descriptor) VALUES (?, ?, ?)
            ON CONFLICT (account_key) DO UPDATE
            SET symbol = excluded.symbol, descriptor = excluded.descriptor`,
            [account.accountKey, account.symbol, account.descriptor],
        );

    const selectAccount = (accountKey: string) => {
        const row = exec<AccountRow>(
            'SELECT account_key, symbol, descriptor FROM accounts WHERE account_key = ?',
            [accountKey],
        ).rows[0];

        return row === undefined ? undefined : toAccount(row);
    };

    // Each network type has its own suspicion detectors; unknown accounts match nothing anyway.
    const groupAccountKeysByNetworkType = (accountKeys: string[]) =>
        accountKeys.reduce((groups, accountKey) => {
            const account = selectAccount(accountKey);
            if (account === undefined) return groups;

            const networkType = getNetworkType(account.symbol);

            return groups.set(networkType, [...(groups.get(networkType) ?? []), accountKey]);
        }, new Map<NetworkType, string[]>());

    const toFilterWhere = (filter: TransactionsFilter) =>
        toFilterClause(filter, groupAccountKeysByNetworkType);

    return {
        replaceAccounts: accounts =>
            runInSqliteTransaction(deps.sqlite, () => {
                const storedAccountKeys = new Set(
                    exec<{ account_key: string }>('SELECT account_key FROM accounts').rows.map(
                        row => row.account_key,
                    ),
                );
                const accountKeys = new Set(accounts.map(({ accountKey }) => accountKey));
                const removedAccountKeys = [...storedAccountKeys].filter(
                    accountKey => !accountKeys.has(accountKey),
                );

                // Their transactions, transfers and sync state go with them (cascade).
                if (removedAccountKeys.length > 0) {
                    exec(
                        `DELETE FROM accounts WHERE account_key IN (${toPlaceholders(removedAccountKeys)})`,
                        removedAccountKeys,
                    );
                }
                accounts.forEach(upsertAccount);

                return { removedAccountKeys };
            }),

        selectAccount,

        selectAccountKeys: ({ symbols }) =>
            symbols.length === 0
                ? []
                : exec<{ account_key: string }>(
                      `SELECT account_key FROM accounts WHERE symbol IN (${toPlaceholders(symbols)})`,
                      symbols,
                  ).rows.map(row => row.account_key),

        replaceKnownTokens: ({ symbol, coin, nft }) =>
            runInSqliteTransaction(deps.sqlite, () => {
                exec('DELETE FROM known_tokens WHERE symbol = ?', [symbol]);
                exec('DELETE FROM token_definition_networks WHERE symbol = ?', [symbol]);
                if (coin === null && nft === null) return;

                exec('INSERT INTO token_definition_networks (symbol) VALUES (?)', [symbol]);
                Object.entries({ coin, nft }).forEach(([kind, contracts]) =>
                    contracts?.forEach(contract =>
                        exec(
                            `INSERT OR IGNORE INTO known_tokens (symbol, kind, contract)
                            VALUES (?, ?, ?)`,
                            [symbol, kind, contract],
                        ),
                    ),
                );
            }),

        upsertTransactions: ({ accountKey, transactions }) => {
            const symbol = exec<{ symbol: string }>(
                'SELECT symbol FROM accounts WHERE account_key = ?',
                [accountKey],
            ).rows[0]?.symbol;
            const networkDecimals = symbol === undefined ? undefined : getNetworkDecimals(symbol);

            return runInSqliteTransaction(deps.sqlite, () =>
                transactions.reduce((changes, transaction) => {
                    const { changes: hasChanged } = exec(
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
                    );
                    // In the same SQLite transaction, so the transfers never disagree with it.
                    if (hasChanged > 0) replaceTransfers(accountKey, transaction, networkDecimals);

                    return changes + hasChanged;
                }, 0),
            );
        },

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

        countTransactions: filter => {
            const { where, parameters } = toFilterWhere(filter);

            return (
                exec<{ count: number }>(
                    `SELECT COUNT(*) AS count FROM transactions t WHERE ${where}`,
                    parameters,
                ).rows[0]?.count ?? 0
            );
        },

        selectTransactions: ({ limit = -1, offset = 0, ...filter }) => {
            const { where, parameters } = toFilterWhere(filter);

            return exec<TransactionRow>(
                `SELECT t.account_key, t.txid, t.block_height, t.block_time, t.data
                FROM transactions t
                WHERE ${where}
                ORDER BY t.block_height IS NULL DESC, t.block_time DESC, t.txid
                LIMIT ? OFFSET ?`,
                [...parameters, limit, offset],
            ).rows.map(row => ({
                accountKey: row.account_key,
                txid: row.txid,
                blockHeight: row.block_height,
                blockTime: row.block_time,
                transaction: JSON.parse(row.data),
            }));
        },

        selectSyncState: accountKey => {
            const row = exec<SyncStateRow>(
                'SELECT is_complete, last_synced_at, last_error FROM sync_state WHERE account_key = ?',
                [accountKey],
            ).rows[0];

            return {
                isComplete: row?.is_complete === 1,
                lastSyncedAt: row?.last_synced_at ?? null,
                // Written only from `TransactionSourceErrorType`.
                lastError: (row?.last_error ?? null) as TransactionSourceErrorType | null,
            };
        },

        selectTrackedAccountKeys: accountKeys =>
            accountKeys.length === 0
                ? []
                : exec<{ account_key: string }>(
                      `SELECT account_key FROM sync_state
                      WHERE account_key IN (${toPlaceholders(accountKeys)})`,
                      accountKeys,
                  ).rows.map(row => row.account_key),

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
    };
};
