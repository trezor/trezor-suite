import { pipe, A, F } from '@mobily/ts-belt';
import { createTransform } from 'redux-persist';

import { TrezorDevice } from '@suite-common/suite-types';
import { DeviceState, selectDiscoveryByDeviceState } from '@suite-common/wallet-core';

const serializeDevice = (device: TrezorDevice) => ({
    ...device,
    path: '',
    remember: true,
    connected: false,
    buttonRequests: [],
});

export const devicePersistTransform = createTransform<DeviceState, Readonly<DeviceState>>(
    (inboundState, _, state) => {
        return {
            selectedDevice: undefined,
            devices: pipe(
                inboundState.devices,
                A.filter(
                    device =>
                        !!device.remember && !selectDiscoveryByDeviceState(state, device.state),
                ),
                A.map(serializeDevice),
                F.toMutable,
            ),
        };
    },
    undefined,
    { whitelist: ['device'] },
);
