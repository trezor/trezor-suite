import type { GetSignVerify } from '@trezor/network-module-suite-types';

import type { SuiteNetworkModuleRepositoryDep } from './SuiteNetworkModuleRepository';

export type GetSignVerifyDeps = SuiteNetworkModuleRepositoryDep;

export type GetSignVerifyDep = {
    getSignVerify: GetSignVerify;
};

export const createGetSignVerify =
    (deps: GetSignVerifyDeps): GetSignVerify =>
    account =>
        deps.suiteNetworkModuleRepository.get(account.symbol).getSignVerify(account);

export const injectGetSignVerify = (services: any): GetSignVerifyDep => ({
    getSignVerify: services.getSignVerify,
});
