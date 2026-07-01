import type { NetworkModule, SuiteModuleApi } from '@network-module/suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { createComposeSolanaTransactionFeeLevels } from './composeTransactionFeeLevels';
import { type SolanaSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type SolanaNetworkModule = NetworkModule<SolanaSupportedCoin>;

export type CreateSolanaNetworkModuleDeps = {
    suiteModuleApi: SuiteModuleApi;
};

export const createSolanaNetworkModule = ({
    suiteModuleApi,
}: CreateSolanaNetworkModuleDeps): SolanaNetworkModule => ({
    addressValidator: solanaValidator,
    composeTransactionFeeLevels: createComposeSolanaTransactionFeeLevels({
        getBlockchainBlockInfoBySymbol: suiteModuleApi.getBlockchainBlockInfoBySymbol,
    }),
    getSupportedCoins,
    isSupportedCoin,
});
