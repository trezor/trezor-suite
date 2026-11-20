import type { GetTrezorBlockchainDep } from '@trezor/blockchain-core';
import type { GetTrezorConnectDep } from '@trezor/connect-common';

/**
 * Application capabilities injected into suite-common network modules.
 * Apps choose their Connect and TrezorBlockchain implementations; modules must not import their
 * runtimes themselves.
 */
export type NetworkSuiteCommonModuleApi = GetTrezorConnectDep<
    | 'signMessage'
    | 'verifyMessage'
    | 'ethereumSignMessage'
    | 'ethereumVerifyMessage'
    | 'cardanoSignMessage'
> &
    GetTrezorBlockchainDep<'getAccountInfo' | 'evmRpcCall'>;
