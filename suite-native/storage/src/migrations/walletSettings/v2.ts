import { PersistedState, getStoredState } from 'redux-persist';

import { WalletSettings } from '@suite-common/wallet-types';

import { isPersistedState } from '../../migrationTypes';
import { MMKVStorage } from '../../mmkvStorage';

type MigratedState = Partial<WalletSettings> & PersistedState;

export const migrateAutoEjectToWalletSettings = (storage: MMKVStorage) => async (
    oldState: unknown,
): Promise<MigratedState> => {
    if (!oldState || !isPersistedState(oldState)) {
        return oldState as MigratedState;
    }

    const devicesState = await getStoredState({
        key: 'devices',
        storage,
    });

    if (!devicesState || !('isDeviceAutoEjectEnabled' in devicesState)) {
        return oldState as MigratedState; // no new migration, just pass the previous one
    }

    return {
        ...oldState,
        isAutoEjectEnabled: devicesState.isDeviceAutoEjectEnabled === true,
    };
};
