import type { GetTrezorConnect, TrezorConnectCallable } from '@trezor/connect-common';

export const mockGetTrezorConnect: GetTrezorConnect<keyof TrezorConnectCallable> = () => {
    throw new Error('Connect is not mocked for this test.');
};
