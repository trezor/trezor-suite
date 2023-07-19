import { createMigrate, persistReducer } from 'redux-persist';
import { Reducer } from '@reduxjs/toolkit';

import { Account } from '@suite-common/wallet-types';

import { initMmkvStorage } from './storage';

interface PartialStateForMigration {
    accounts: Account[];
}

// TODO create mock types for old and new account types

const migrateAccountLabel = (oldAccounts: Account[]): MigratedAccount[] =>
    oldAccounts.map(oldAccount => {
        if (!oldAccount.metadata || !oldAccount.metadata.accountLabel) {
            return oldAccount as MigratedAccount;
        }

        const { accountLabel, ...metadataWithoutAccountLabel } = oldAccount.metadata;

        return {
            ...oldAccount,
            metadata: {
                ...metadataWithoutAccountLabel,
                accountLabel,
            },
        };
    });

export const preparePersistReducer = async <TReducerInitialState>({
    reducer,
    persistedKeys,
    key,
    version,
}: {
    reducer: Reducer<TReducerInitialState>;
    persistedKeys: Array<keyof TReducerInitialState>;
    key: string;
    version: number;
}) => {
    const migrations = {
        // TODO type the whole wallet state
        [version]: (oldState: any) => {
            const oldAccountsState: PartialStateForMigration = { accounts: oldState.accounts };
            const migratedAccounts = migrateAccountLabel(oldAccountsState.accounts);
            const migratedState = { ...oldState, accounts: migratedAccounts };
            return migratedState;
        },
    };

    const persistConfig = {
        key,
        storage: await initMmkvStorage(),
        whitelist: persistedKeys as string[],
        version,
        migrate: createMigrate(migrations, { debug: false }),
    };

    return persistReducer(persistConfig, reducer);
};
