import type { NetworkModule, SuiteModuleApi } from '@network-module/suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { createComposeStellarTransactionFeeLevels } from './composeTransactionFeeLevels';
import { type StellarSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type StellarNetworkModule = NetworkModule<StellarSupportedCoin>;

export type CreateStellarNetworkModuleDeps = {
    suiteModuleApi: SuiteModuleApi;
};

export const createStellarNetworkModule = (
    _deps: CreateStellarNetworkModuleDeps,
): StellarNetworkModule => ({
    addressValidator: stellarValidator,
    composeTransactionFeeLevels: createComposeStellarTransactionFeeLevels(),
    getSupportedCoins,
    isSupportedCoin,
});
