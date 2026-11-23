import { type NetworkModule, createNetworkModule } from '@trezor/network-module-suite-common-types';
import { rippleAssets } from '@trezor/network-ripple-assets';
import { type RippleNetworkSymbol, supportedRippleNetworks } from '@trezor/network-ripple-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export type RippleSuiteCommonNetworkModule = NetworkModule<RippleNetworkSymbol>;

export const createRippleSuiteCommonNetworkModule = (): RippleSuiteCommonNetworkModule =>
    createNetworkModule(supportedRippleNetworks, {
        icon: rippleAssets,
        addressValidator: rippleValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
