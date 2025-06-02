import { createThunk } from '@suite-common/redux-utils';
import { acquireDevice } from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import { THP_PREFIX } from './thpActions';

type AutoInitThpAfterDeviceConnectionThunkParams = {
    device: Device;
};

export const autoInitThpAfterDeviceConnectionThunk = createThunk<
    void,
    AutoInitThpAfterDeviceConnectionThunkParams,
    void
>(`${THP_PREFIX}/autoInitThpAfterDeviceConnectionThunk`, ({ device }, { dispatch }) => {
    if (device?.thp !== undefined) {
        dispatch(acquireDevice({ requestedDevice: device as any })); // TODO: fixme trezorDevice expected
    }
});
