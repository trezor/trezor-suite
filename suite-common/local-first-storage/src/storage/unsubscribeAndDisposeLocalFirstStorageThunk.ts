import { OwnerId } from '@evolu/common';

import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';

import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import { localFirstStorageProvider, subscriptionStorage } from './sharedObjects';

type UnsubscribeLocalFirstStorageThunkParams = {
    device: TrezorDevice;
};

export const unsubscribeAndDisposeLocalFirstStorageThunk = createThunk<
    void,
    UnsubscribeLocalFirstStorageThunkParams,
    void
>(`${LOCAL_FIRST_STORAGE_PREFIX}/unsubscribeLocalFirstStorageThunk`, ({ device }) => {
    console.log('___unsubscribeLocalFirstStorageThunk', device.state?.staticSessionId);

    if (localFirstStorageProvider === null) {
        throw new Error("throw Error('initLocalFirstStorageThunk() must be called before this!');");
    }

    const deviceStaticSessionId = device.state?.staticSessionId;

    if (deviceStaticSessionId === undefined) {
        return;
    }

    const ownerIdRaw = device.localFirstStorageSecret?.evoluKeys?.ownerId;

    if (ownerIdRaw === undefined) {
        return;
    }

    const ownerIdResult = OwnerId.from(ownerIdRaw);
    if (!ownerIdResult.ok) {
        return;
    }

    Object.values(subscriptionStorage[deviceStaticSessionId]).forEach(callback => callback());

    delete subscriptionStorage[deviceStaticSessionId];
    localFirstStorageProvider.deleteStorage(ownerIdResult.value);
});
