import type { GetTrezorBlockchainDep } from '@trezor/blockchain-core';

/**
 * Application capabilities injected into suite-common network modules.
 * Apps choose their TrezorBlockchain implementation; modules must not import its runtime themselves.
 */
export type NetworkSuiteCommonModuleApi = GetTrezorBlockchainDep<'getAccountInfo' | 'evmRpcCall'>;
