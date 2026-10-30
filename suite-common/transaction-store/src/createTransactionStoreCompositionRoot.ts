import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type Result, ok } from '@trezor/type-utils';

import { createTransactionRepository } from './repository/createTransactionRepository';
import {
    type MigrateTransactionStoreSchemaError,
    migrateTransactionStoreSchema,
} from './schema/migrateTransactionStoreSchema';
import type { TransactionSourceDep } from './source/transactionSource';
import type { TransactionStoreSqliteDep } from './sqlite/transactionStoreSqlite';
import { createSyncAccountTransactions } from './sync/createSyncAccountTransactions';
import { createSyncQueue } from './sync/createSyncQueue';
import type { TransactionStore } from './transactionStore';
import type { TransactionStoreEvent, TransactionStoreListener } from './transactionStoreTypes';

/** What each platform entry provides: its SQLite and its backends. */
export type TransactionStoreCompositionRootDeps = TransactionStoreSqliteDep &
    TransactionSourceDep & {
        now: () => number;
    };

/**
 * Starts the store: migrates the database and wires the engine. It is lazy: it downloads an
 * account's history only once something asks for it (`ensureSynced`), keeps those accounts fresh
 * when the app says they changed (`refreshAccounts`), and has no clock of its own.
 */
export const createTransactionStoreCompositionRoot = (
    deps: TransactionStoreCompositionRootDeps,
): Result<TransactionStore, MigrateTransactionStoreSchemaError> => {
    const migration = migrateTransactionStoreSchema(deps);

    if (!migration.success) {
        return migration;
    }

    const listeners = new Set<TransactionStoreListener>();
    const emit = (event: TransactionStoreEvent) => listeners.forEach(listener => listener(event));

    const transactionRepository = createTransactionRepository(deps);
    // What is suspicious may have changed for these networks' accounts, so their lists refetch.
    const emitNetworksChanged = (symbols: NetworkSymbol[]) => {
        const accountKeys = transactionRepository.selectAccountKeys({ symbols });

        if (accountKeys.length > 0) emit({ type: 'transactionsChanged', accountKeys });
    };
    const syncAccountTransactions = createSyncAccountTransactions({
        transactionRepository,
        transactionSource: deps.transactionSource,
        now: deps.now,
        onTransactionsStored: accountKey =>
            emit({ type: 'transactionsChanged', accountKeys: [accountKey] }),
    });
    const syncQueue = createSyncQueue({
        syncAccountTransactions,
        transactionRepository,
        onStatusChanged: status => emit({ type: 'syncStatusChanged', status }),
    });

    const transactionStore: TransactionStore = {
        setAccounts: accounts => {
            const { removedAccountKeys } = transactionRepository.replaceAccounts(accounts);

            if (removedAccountKeys.length > 0) {
                emit({ type: 'transactionsChanged', accountKeys: removedAccountKeys });
            }

            return Promise.resolve();
        },
        ensureSynced: async accountKeys => {
            syncQueue.requestSync({
                accountKeys: accountKeys.filter(
                    accountKey =>
                        transactionRepository.selectAccount(accountKey) !== undefined &&
                        transactionRepository.selectSyncState(accountKey).lastSyncedAt === null,
                ),
                mode: 'latest',
            });
            await Promise.all(accountKeys.map(syncQueue.whenSettled));

            return accountKeys.map(syncQueue.getSyncStatus);
        },
        refreshAccounts: accountKeys => {
            syncQueue.requestSync({
                accountKeys: transactionRepository.selectTrackedAccountKeys(accountKeys),
                mode: 'latest',
            });

            return Promise.resolve();
        },
        requestFullHistory: accountKey => {
            syncQueue.requestSync({ accountKeys: [accountKey], mode: 'full' });

            return Promise.resolve();
        },
        getSyncStatus: accountKeys => Promise.resolve(accountKeys.map(syncQueue.getSyncStatus)),
        setKnownTokens: knownTokens => {
            knownTokens.forEach(transactionRepository.replaceKnownTokens);
            emitNetworksChanged(knownTokens.map(({ symbol }) => symbol));

            return Promise.resolve();
        },
        selectTransactions: params =>
            Promise.resolve(transactionRepository.selectTransactions(params)),
        countTransactions: filter =>
            Promise.resolve(transactionRepository.countTransactions(filter)),
        subscribe: listener => {
            listeners.add(listener);

            return Promise.resolve(() => {
                listeners.delete(listener);
            });
        },
        dispose: async () => {
            await syncQueue.close();
            listeners.clear();
        },
    };

    return ok(transactionStore);
};
