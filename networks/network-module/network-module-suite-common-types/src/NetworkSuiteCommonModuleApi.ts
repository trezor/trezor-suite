import type { GetTrezorConnectDep } from './GetTrezorConnect';

export type NetworkSuiteCommonModuleApi = GetTrezorConnectDep<
    'getAccountInfo' | 'blockchainEvmRpcCall'
>;
