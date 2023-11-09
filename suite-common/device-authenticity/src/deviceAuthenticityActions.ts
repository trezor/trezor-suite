import { createAction } from '@reduxjs/toolkit';

import { TrezorDevice } from '@suite-common/suite-types';
import { AuthenticateDeviceResult } from '@trezor/connect';

export const ACTION_PREFIX = '@device-authenticity';

export type StoredAuthenticateDeviceResult =
    | (Omit<Partial<AuthenticateDeviceResult>, 'error'> & {
          error?: string;
      })
    | undefined;

const result = createAction(
    `${ACTION_PREFIX}/result`,
    (payload: { device: TrezorDevice; result: StoredAuthenticateDeviceResult }) => ({
        payload,
    }),
);

export const deviceAuthenticityActions = {
    result,
} as const;
