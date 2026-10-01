import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedTronNetworks } from '@trezor/network-tron/constants';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { getNetworkConfig } from './networkConfig';
import { tronWalletConnectAdapter } from './walletConnect/tronWalletConnectAdapter';

export const createTronSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedTronNetworks, {
        addressValidator: tronValidator,
        walletConnectAdapter: tronWalletConnectAdapter,
        getNetworkConfig,
    });
