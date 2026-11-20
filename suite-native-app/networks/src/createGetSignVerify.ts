import type { GetSignVerify } from '@trezor/network-module-suite-native-types';

import type { SuiteNativeNetworkModuleRepositoryDep } from './SuiteNativeNetworkModuleRepository';

export type GetSignVerifyDeps = SuiteNativeNetworkModuleRepositoryDep;

export type GetSignVerifyDep = {
    getSignVerify: GetSignVerify;
};

export const createGetSignVerify =
    (deps: GetSignVerifyDeps): GetSignVerify =>
    account =>
        deps.suiteNativeNetworkModuleRepository.get(account.symbol).getSignVerify(account);

export const injectGetSignVerify = (services: any): GetSignVerifyDep => ({
    getSignVerify: services.getSignVerify,
});
