import type { Account } from '@suite-common/wallet-types';
import type { SignVerifyFeature } from '@trezor/network-module-suite-types';

import type { SuiteNetworkModuleRepositoryDep } from './SuiteNetworkModuleRepository';

export type GetSignVerifyDeps = SuiteNetworkModuleRepositoryDep;

/** The Sign & Verify feature of the account's network, or `null` where it has none. */
export type GetSignVerify = (account: Account) => SignVerifyFeature | null;

export type GetSignVerifyDep = {
    getSignVerify: GetSignVerify;
};

export const createGetSignVerify =
    (deps: GetSignVerifyDeps): GetSignVerify =>
    account =>
        deps.suiteNetworkModuleRepository.find(account.symbol)?.getSignVerify(account) ?? null;

export const injectGetSignVerify = (services: any): GetSignVerifyDep => ({
    getSignVerify: services.getSignVerify,
});
