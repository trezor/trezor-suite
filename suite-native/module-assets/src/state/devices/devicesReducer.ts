import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { devicesActions, DummyDevice } from './devicesActions';

export type DevicesState = DummyDevice[];

export const devicesInitialState: DevicesState = [];

export type DevicesRootState = {
    devices: DevicesState;
};

const create = (state: DevicesState, payload: DummyDevice) => {
    state.push(payload);
};

export const prepareDevicesReducer = createReducerWithExtraDeps(devicesInitialState, builder => {
    builder.addCase(devicesActions.createDevice, (state, action) => {
        create(state, action.payload);
    });
});

export const selectDeviceById = (deviceId: string) => (state: DevicesRootState) =>
    state.devices.find(device => device.id === deviceId);
