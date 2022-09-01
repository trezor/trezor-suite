import { TrezorDevice } from '@suite-common/suite-types';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { devicesActions } from './devicesActions';

export type DevicesState = TrezorDevice[];

export const devicesInitialState: DevicesState = [];

export type DevicesRootState = {
    devices: DevicesState;
};

const create = (state: DevicesState, payload: TrezorDevice) => {
    state.push(payload);
};

export const prepareDevicesReducer = createReducerWithExtraDeps(devicesInitialState, builder => {
    builder.addCase(devicesActions.createDeviceInstance, (state, action) => {
        create(state, action.payload);
    });
});
