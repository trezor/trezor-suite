import { PersistedState, getStoredState } from 'redux-persist';

import { WalletSettings } from '@suite-common/wallet-types';

import { isPersistedState } from '../../migrationTypes';
import { initMmkvStorage } from '../../storage';

type MigratedState = Partial<WalletSettings> & PersistedState;

export const migrateAutoEjectToWalletSettings = async (
    oldState: unknown,
): Promise<MigratedState> => {
    if (!oldState || !isPersistedState(oldState)) {
        return oldState as MigratedState;
    }

    const devicesState = await getStoredState({
        key: 'devices',
        storage: await initMmkvStorage(),
    });

    if (!devicesState || !('isDeviceAutoEjectEnabled' in devicesState)) {
        return oldState as MigratedState; // no new migration, just pass the previous one
    }

    return {
        ...oldState,
        isAutoEjectEnabled: devicesState.isDeviceAutoEjectEnabled === true,
    };
};
