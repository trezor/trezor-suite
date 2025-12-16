import { PersistedState, getStoredState } from 'redux-persist';

import { WalletSettings } from '@suite-common/wallet-types';

import { createEnsureMMKVKey } from '../../ensureMMKVKey';
import { isPersistedState } from '../../migrationTypes';
import { createMMKVStorage } from '../../mmkvStorage';

type MigratedState = Partial<WalletSettings> & PersistedState;

export const migrateAutoEjectToWalletSettings = async (
    oldState: unknown,
): Promise<MigratedState> => {
    if (!oldState || !isPersistedState(oldState)) {
        return oldState as MigratedState;
    }

    const ensureMMKVKey = await createEnsureMMKVKey();
    const storage = await createMMKVStorage({ ensureMMKVKey });

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
