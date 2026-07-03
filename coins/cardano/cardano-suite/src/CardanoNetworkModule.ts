import type { NetworkModule, SuiteModuleApi } from '@network-module/suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { createComposeCardanoTransactionFeeLevels } from './composeTransactionFeeLevels';
import { type CardanoSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type CardanoNetworkModule = NetworkModule<CardanoSupportedCoin>;

export type CreateCardanoNetworkModuleDeps = {
    suiteModuleApi: SuiteModuleApi;
};

export const createCardanoNetworkModule = ({
    suiteModuleApi,
}: CreateCardanoNetworkModuleDeps): CardanoNetworkModule => ({
    addressValidator: adaValidator,
    composeTransactionFeeLevels: createComposeCardanoTransactionFeeLevels({
        addToast: suiteModuleApi.addToast,
    }),
    getSupportedCoins,
    isSupportedCoin,
});
