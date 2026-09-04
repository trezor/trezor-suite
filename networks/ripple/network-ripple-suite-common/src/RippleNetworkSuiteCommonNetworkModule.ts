import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import {
    type RippleNetworkSymbol,
    isSupportedRippleNetwork,
    supportedRippleNetworks,
} from '@trezor/network-ripple/constants';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type RippleNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<RippleNetworkSymbol>;

const isTestnet = (symbol: RippleNetworkSymbol): boolean => getNetworkConfig(symbol).testnet;

export const createRippleSuiteCommonNetworkModule = (): RippleNetworkSuiteCommonNetworkModule => ({
    addressValidator: rippleValidator,
    getSupportedNetworks: () => supportedRippleNetworks,
    isSupportedNetwork: isSupportedRippleNetwork,
    isTestnet,
    getNetworkConfig,
});
