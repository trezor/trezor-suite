import TrezorConnect, { type GetTrezorConnectPrivilegedDep } from '@trezor/connect';

// Returns the (jest-mocked) Connect instance the connect-init thunk should drive. It must be the
// default export itself — the thunk registers `.on` handlers and tests spy on `.init`, so it has
// to be the object the test emits on. Note this is intentionally NOT testMocks.getTrezorConnectMock(),
// which returns a fresh spread copy on every call.
export const mockGetTrezorConnect: GetTrezorConnectPrivilegedDep['getTrezorConnect'] = () =>
    TrezorConnect;
