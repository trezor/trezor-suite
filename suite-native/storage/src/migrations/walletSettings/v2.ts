import { type PersistedState } from 'redux-persist';

import { type WalletSettings } from '@suite-common/wallet-types';

import type { MigrationDeps } from './v1';
import { isPersistedState } from '../../migrationTypes';

type MigratedState = Partial<WalletSettings> & PersistedState;

export const migrateAutoEjectToWalletSettings =
    (deps: MigrationDeps) =>
    async (oldState: unknown): Promise<MigratedState> => {
        if (!oldState || !isPersistedState(oldState)) {
            return oldState as MigratedState;
        }

        const devicesState = await deps.getStoredState({
            key: 'devices',
            storage: deps.mmkvStorage,
        });

        if (!devicesState || !('isDeviceAutoEjectEnabled' in devicesState)) {
            return oldState as MigratedState; // no new migration, just pass the previous one
        }

        return {
            ...oldState,
            isAutoEjectEnabled: devicesState.isDeviceAutoEjectEnabled === true,
        };
    };
