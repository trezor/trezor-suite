import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { tronAssets } from '@trezor/network-tron-assets';
import { supportedTronNetworks } from '@trezor/network-tron-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';
import { tronWalletConnectAdapter } from './walletConnect/tronWalletConnectAdapter';

export const createTronSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedTronNetworks, {
        icon: tronAssets,
        addressValidator: tronValidator,
        walletConnectAdapter: tronWalletConnectAdapter,
        getNetworkConfig,
        getAccountSyncInterval,
    });
