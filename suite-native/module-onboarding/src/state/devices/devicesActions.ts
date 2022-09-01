import { createAction } from '@reduxjs/toolkit';

import { TrezorDevice } from '@suite-common/suite-types';

export const actionPrefix = '@devices';

const createDeviceInstance = createAction(
    `${actionPrefix}/createDeviceInstance`,
    (payload: TrezorDevice) => ({
        payload,
    }),
);

export const devicesActions = {
    createDeviceInstance,
};
