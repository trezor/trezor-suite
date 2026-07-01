import type { NetworkModule, SuiteModuleApi } from '@network-module/suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { createComposeRippleTransactionFeeLevels } from './composeTransactionFeeLevels';
import { type RippleSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type RippleNetworkModule = NetworkModule<RippleSupportedCoin>;

export type CreateRippleNetworkModuleDeps = {
    suiteModuleApi: SuiteModuleApi;
};

export const createRippleNetworkModule = (
    _deps: CreateRippleNetworkModuleDeps,
): RippleNetworkModule => ({
    addressValidator: rippleValidator,
    composeTransactionFeeLevels: createComposeRippleTransactionFeeLevels(),
    getSupportedCoins,
    isSupportedCoin,
});
