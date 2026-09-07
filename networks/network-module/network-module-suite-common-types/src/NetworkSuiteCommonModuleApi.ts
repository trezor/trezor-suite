import type { TrezorConnectCallable } from '@trezor/connect-common';

export type NetworkSuiteCommonModuleApi = {
    // Read Connect at call time: legacy initialization replaces methods on the application instance.
    getTrezorConnect: () => Pick<TrezorConnectCallable, 'getAccountInfo' | 'blockchainEvmRpcCall'>;
};
