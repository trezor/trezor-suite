import type { GetSignVerify } from '@trezor/network-module-suite-types';

import type { SuiteNetworkModuleRepositoryDep } from './SuiteNetworkModuleRepository';

export type GetSignVerifyDeps = SuiteNetworkModuleRepositoryDep;

export const createGetSignVerify =
    (deps: GetSignVerifyDeps): GetSignVerify =>
    networkSymbol =>
        deps.suiteNetworkModuleRepository.get(networkSymbol).signVerify;
