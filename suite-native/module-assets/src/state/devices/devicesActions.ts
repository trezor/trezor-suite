import { createAction } from '@reduxjs/toolkit';

import { TrezorDevice } from '@suite-common/suite-types';

export const actionPrefix = '@devices';

export type DummyDevice = Pick<TrezorDevice, 'id' | 'state' | 'label'>;

const createDevice = createAction(`${actionPrefix}/createDevice`, (payload: DummyDevice) => ({
    payload,
}));

export const devicesActions = {
    createDevice,
};
