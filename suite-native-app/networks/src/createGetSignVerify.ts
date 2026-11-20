import type { GetSignVerify } from '@trezor/network-module-suite-native-types';

import type { SuiteNativeNetworkModuleRepositoryDep } from './SuiteNativeNetworkModuleRepository';

export type GetSignVerifyDeps = SuiteNativeNetworkModuleRepositoryDep;

export const createGetSignVerify =
    (deps: GetSignVerifyDeps): GetSignVerify =>
    networkSymbol =>
        deps.suiteNativeNetworkModuleRepository.get(networkSymbol).signVerify;
