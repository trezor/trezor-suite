import type { NetworkModule, SuiteModuleApi } from '@network-module/suite-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import { createComposeEthereumTransactionFeeLevels } from './composeTransactionFeeLevels';
import { type EthereumSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type EthereumNetworkModule = NetworkModule<EthereumSupportedCoin>;

export type CreateEthereumNetworkModuleDeps = {
    suiteModuleApi: SuiteModuleApi;
};

export const createEthereumNetworkModule = ({
    suiteModuleApi,
}: CreateEthereumNetworkModuleDeps): EthereumNetworkModule => ({
    addressValidator: ethereumValidator,
    composeTransactionFeeLevels: createComposeEthereumTransactionFeeLevels({
        addToast: suiteModuleApi.addToast,
        getIsApprovalFlowSupported: suiteModuleApi.getIsApprovalFlowSupported,
    }),
    getSupportedCoins,
    isSupportedCoin,
});
