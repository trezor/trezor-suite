import type { Compilable } from 'kysely';

import { getNetworkDecimals } from '@suite-common/wallet-config';
import type { Transaction } from '@trezor/blockchain-link-types';

import {
    transactionStoreDb as db,
    toTransactionStoreQuery,
} from '../query/transactionStoreDatabase';
import type { TransactionStoreSqliteDep } from '../sqlite/transactionStoreSqlite';
import type {
    KnownTokens,
    StoredAccount,
    TransactionSourceErrorType,
    TransactionStoreAccount,
} from '../transactionStoreTypes';
import { flattenTransfers } from './flattenTransfers';

export type TransactionRepositoryDeps = TransactionStoreSqliteDep & {
    /** After every write, once it is committed; the live queries re-run on it. */
    onWritten: () => void;
};

export type SyncState = {
    isComplete: boolean;
    lastSyncedAt: number | null;
    lastError: TransactionSourceErrorType | null;
};

/** The engine's own reads and writes; the app reads with queries of its own. */
export type TransactionRepository = {
    /**
     * Makes the stored accounts exactly these: upserts them, and deletes every other stored
     * account with its whole history.
     */
    replaceAccounts: (accounts: TransactionStoreAccount[]) => Promise<void>;
    selectAccount: (accountKey: string) => Promise<StoredAccount | undefined>;
    /** Makes the network's known tokens exactly these; `null` lists forget its definitions. */
    replaceKnownTokens: (knownTokens: KnownTokens) => Promise<void>;
    upsertTransactions: (params: {
        account: StoredAccount;
        transactions: Transaction[];
    }) => Promise<void>;
    selectStoredTxids: (params: { accountKey: string; txids: string[] }) => Promise<Set<string>>;
    selectSyncState: (accountKey: string) => Promise<SyncState>;
    /** The accounts the store has synced or tried to, i.e. the ones someone has asked for. */
    selectTrackedAccountKeys: (accountKeys: string[]) => Promise<string[]>;
    updateSyncState: (params: { accountKey: string } & SyncState) => Promise<void>;
    setSyncing: (params: { accountKey: string; isSyncing: boolean }) => Promise<void>;
    /** No sync outlives the store, so on start none is running. */
    clearSyncing: () => Promise<void>;
};

export type TransactionRepositoryDep = { transactionRepository: TransactionRepository };

const toBlockHeight = (transaction: Transaction) =>
    transaction.blockHeight !== undefined && transaction.blockHeight > 0
        ? transaction.blockHeight
        : null;

/** A transaction's row and its transfers' rows, replaced together. */
const toUpsertTransaction = (
    accountKey: string,
    transaction: Transaction,
    networkDecimals: number | undefined,
): Compilable<unknown>[] => {
    const blockHeight = toBlockHeight(transaction);
    const blockTime = transaction.blockTime ?? null;
    const transfers = flattenTransfers(transaction, networkDecimals);

    return [
        db
            .insertInto('transactions')
            .values({
                account_key: accountKey,
                txid: transaction.txid,
                block_height: blockHeight,
                block_time: blockTime,
                type: transaction.type,
                data: JSON.stringify(transaction),
            })
            .onConflict(oc =>
                oc
                    .columns(['account_key', 'txid'])
                    .doUpdateSet(eb => ({
                        block_height: eb.ref('excluded.block_height'),
                        block_time: eb.ref('excluded.block_time'),
                        type: eb.ref('excluded.type'),
                        data: eb.ref('excluded.data'),
                    }))
                    // An unchanged row is not rewritten.
                    .whereRef('transactions.data', 'is not', 'excluded.data'),
            ),
        db
            .deleteFrom('transfers')
            .where('account_key', '=', accountKey)
            .where('txid', '=', transaction.txid),
        ...(transfers.length === 0
            ? []
            : [
                  db.insertInto('transfers').values(
                      transfers.map(({ fromAddress, toAddress, ...transfer }) => ({
                          ...transfer,
                          account_key: accountKey,
                          txid: transaction.txid,
                          from_address: fromAddress,
                          to_address: toAddress,
                          block_height: blockHeight,
                          block_time: blockTime,
                      })),
                  ),
              ]),
    ];
};

export const createTransactionRepository = (
    deps: TransactionRepositoryDeps,
): TransactionRepository => {
    const run = async <TRow>(query: Compilable<TRow>) =>
        // The rows are what the query selects; its type says so.
        (await deps.sqlite.exec(toTransactionStoreQuery(query))) as TRow[];

    /** Atomically, then tells the live queries. */
    const write = async (queries: Compilable<unknown>[]) => {
        await deps.sqlite.execBatch(queries.map(query => toTransactionStoreQuery(query)));
        deps.onWritten();
    };

    return {
        replaceAccounts: accounts => {
            const accountKeys = accounts.map(({ accountKey }) => accountKey);

            return write([
                // Their transactions, transfers and sync state go with them (cascade).
                db
                    .deleteFrom('accounts')
                    .$if(accountKeys.length > 0, query =>
                        query.where('account_key', 'not in', accountKeys),
                    ),
                ...accounts.map(({ accountKey, symbol, descriptor }) =>
                    db
                        .insertInto('accounts')
                        .values({ account_key: accountKey, symbol, descriptor })
                        .onConflict(oc =>
                            oc.column('account_key').doUpdateSet(eb => ({
                                symbol: eb.ref('excluded.symbol'),
                                descriptor: eb.ref('excluded.descriptor'),
                            })),
                        ),
                ),
            ]);
        },

        selectAccount: async accountKey => {
            const [row] = await run(
                db
                    .selectFrom('accounts')
                    .select(['account_key', 'symbol', 'descriptor'])
                    .where('account_key', '=', accountKey),
            );

            return row === undefined
                ? undefined
                : { accountKey: row.account_key, symbol: row.symbol, descriptor: row.descriptor };
        },

        replaceKnownTokens: ({ symbol, coin, nft }) => {
            const knownTokens = [
                ...(coin ?? []).map(contract => ({ symbol, kind: 'coin' as const, contract })),
                ...(nft ?? []).map(contract => ({ symbol, kind: 'nft' as const, contract })),
            ];

            return write([
                db.deleteFrom('known_tokens').where('symbol', '=', symbol),
                db.deleteFrom('token_definition_networks').where('symbol', '=', symbol),
                ...(coin === null && nft === null
                    ? []
                    : [db.insertInto('token_definition_networks').values({ symbol })]),
                ...(knownTokens.length === 0
                    ? []
                    : [db.insertInto('known_tokens').values(knownTokens).orIgnore()]),
            ]);
        },

        upsertTransactions: ({ account, transactions }) => {
            const networkDecimals = getNetworkDecimals(account.symbol);

            return write(
                transactions.flatMap(transaction =>
                    toUpsertTransaction(account.accountKey, transaction, networkDecimals),
                ),
            );
        },

        selectStoredTxids: async ({ accountKey, txids }) =>
            new Set(
                txids.length === 0
                    ? []
                    : (
                          await run(
                              db
                                  .selectFrom('transactions')
                                  .select('txid')
                                  .where('account_key', '=', accountKey)
                                  .where('txid', 'in', txids),
                          )
                      ).map(row => row.txid),
            ),

        selectSyncState: async accountKey => {
            const [row] = await run(
                db
                    .selectFrom('sync_state')
                    .select(['is_complete', 'last_synced_at', 'last_error'])
                    .where('account_key', '=', accountKey),
            );

            return {
                isComplete: row?.is_complete === 1,
                lastSyncedAt: row?.last_synced_at ?? null,
                lastError: row?.last_error ?? null,
            };
        },

        selectTrackedAccountKeys: async accountKeys =>
            accountKeys.length === 0
                ? []
                : (
                      await run(
                          db
                              .selectFrom('sync_state')
                              .select('account_key')
                              .where('account_key', 'in', accountKeys),
                      )
                  ).map(row => row.account_key),

        updateSyncState: ({ accountKey, isComplete, lastSyncedAt, lastError }) =>
            write([
                db
                    .insertInto('sync_state')
                    .values({
                        account_key: accountKey,
                        is_complete: isComplete ? 1 : 0,
                        last_synced_at: lastSyncedAt,
                        last_error: lastError,
                    })
                    .onConflict(oc =>
                        oc.column('account_key').doUpdateSet(eb => ({
                            is_complete: eb.ref('excluded.is_complete'),
                            last_synced_at: eb.ref('excluded.last_synced_at'),
                            last_error: eb.ref('excluded.last_error'),
                        })),
                    ),
            ]),

        setSyncing: ({ accountKey, isSyncing }) =>
            write([
                db
                    .insertInto('sync_state')
                    .values({ account_key: accountKey, is_syncing: isSyncing ? 1 : 0 })
                    .onConflict(oc =>
                        oc.column('account_key').doUpdateSet(eb => ({
                            is_syncing: eb.ref('excluded.is_syncing'),
                        })),
                    ),
            ]),

        clearSyncing: () =>
            write([
                db.updateTable('sync_state').set({ is_syncing: 0 }).where('is_syncing', '=', 1),
            ]),
    };
};
