import { type NetworkModule, createNetworkModule } from '@trezor/network-module-suite-common-types';
import { tronAssets } from '@trezor/network-tron-assets';
import { type TronNetworkSymbol, supportedTronNetworks } from '@trezor/network-tron-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export type TronSuiteCommonNetworkModule = NetworkModule<TronNetworkSymbol>;

export const createTronSuiteCommonNetworkModule = (): TronSuiteCommonNetworkModule =>
    createNetworkModule(supportedTronNetworks, {
        icon: tronAssets,
        addressValidator: tronValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
