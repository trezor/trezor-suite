import type { TrezorConnectCallable } from '@trezor/connect-common';

import type { GetTrezorConnect } from '../src/GetTrezorConnect';

export const mockGetTrezorConnect: GetTrezorConnect<keyof TrezorConnectCallable> = () => {
    throw new Error('Connect is not mocked for this test.');
};
