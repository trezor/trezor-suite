import type { NetworkModule, SuiteModuleApi } from '@network-module/suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { createComposeTronTransactionFeeLevels } from './composeTransactionFeeLevels';
import { type TronSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type TronNetworkModule = NetworkModule<TronSupportedCoin>;

export type CreateTronNetworkModuleDeps = {
    suiteModuleApi: SuiteModuleApi;
};

export const createTronNetworkModule = ({
    suiteModuleApi,
}: CreateTronNetworkModuleDeps): TronNetworkModule => ({
    addressValidator: tronValidator,
    composeTransactionFeeLevels: createComposeTronTransactionFeeLevels({
        addToast: suiteModuleApi.addToast,
    }),
    getSupportedCoins,
    isSupportedCoin,
});
