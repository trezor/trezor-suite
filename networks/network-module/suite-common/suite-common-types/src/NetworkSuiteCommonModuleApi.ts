import type { GetTrezorBlockchainDep } from '@trezor/blockchain-core';

/**
 * Application capabilities injected into suite-common network modules.
 * Apps choose their TrezorBlockchain implementation; modules must not import their
 * runtimes themselves.
 */
export type NetworkSuiteCommonModuleApi = GetTrezorBlockchainDep<'getAccountInfo' | 'evmRpcCall'>;
