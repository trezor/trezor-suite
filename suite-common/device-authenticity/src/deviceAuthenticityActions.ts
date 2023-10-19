import { createAction } from '@reduxjs/toolkit';

import { TrezorDevice } from '@suite-common/suite-types';
import { AuthenticateDeviceResult } from '@trezor/connect';

export const ACTION_PREFIX = '@device-authenticity';

const result = createAction(
    `${ACTION_PREFIX}/result`,
    (payload: { device: TrezorDevice; result: AuthenticateDeviceResult }) => ({
        payload,
    }),
);

export const deviceAuthenticityActions = {
    result,
} as const;
