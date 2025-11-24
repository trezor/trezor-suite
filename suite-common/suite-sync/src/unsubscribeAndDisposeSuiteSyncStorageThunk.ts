import { createThunk } from '@suite-common/redux-utils';
import { subscriptionStorage, suiteSyncStorageProvider } from '@suite-common/suite-sync-storage';
import { TrezorDeviceWithState } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { typedObjectValues } from '@trezor/utils';

import { SUITE_SYNC_STORAGE_PREFIX } from './constants';

type UnsubscribeAndDisposeSuiteSyncStorageThunkParams = {
    device: TrezorDeviceWithState;
};

export const unsubscribeAndDisposeSuiteSyncStorageThunk = createThunk<
    void,
    UnsubscribeAndDisposeSuiteSyncStorageThunkParams,
    void
>(`${SUITE_SYNC_STORAGE_PREFIX}/unsubscribeAndDisposeSuiteSyncStorageThunk`, async ({ device }) => {
    if (suiteSyncStorageProvider === null) {
        throw Error('initSuiteSync[Desktop|Native]() must be called before this!');
    }

    const deviceStaticSessionId = device.state.staticSessionId;

    const owner = device.suiteSyncOwner;

    if (owner === undefined) {
        return;
    }

    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    typedObjectValues(subscriptionStorage[walletDescriptor]).forEach(callback => callback?.());

    delete subscriptionStorage[walletDescriptor];
    await suiteSyncStorageProvider.deleteStorage(owner.ownerId);
});
