import type { GetTrezorConnectDep } from '@trezor/connect-common';

/**
 * Application capabilities injected into suite-common network modules.
 * Apps choose their Connect implementation; modules must not import its runtime themselves.
 */
export type NetworkSuiteCommonModuleApi = GetTrezorConnectDep<
    'getAccountInfo' | 'blockchainEvmRpcCall'
>;
