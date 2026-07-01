import type { NetworkModule, SuiteModuleApi } from '@network-module/suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { createComposeBitcoinTransactionFeeLevels } from './composeTransactionFeeLevels';
import { type BitcoinSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type BitcoinNetworkModule = NetworkModule<BitcoinSupportedCoin>;

export type CreateBitcoinNetworkModuleDeps = {
    suiteModuleApi: SuiteModuleApi;
};

export const createBitcoinNetworkModule = ({
    suiteModuleApi,
}: CreateBitcoinNetworkModuleDeps): BitcoinNetworkModule => ({
    addressValidator: bitcoinValidator,
    composeTransactionFeeLevels: createComposeBitcoinTransactionFeeLevels({
        addToast: suiteModuleApi.addToast,
        getAreSatsAmountUnit: suiteModuleApi.getAreSatsAmountUnit,
        getSelectedDevice: suiteModuleApi.getSelectedDevice,
    }),
    getSupportedCoins,
    isSupportedCoin,
});
