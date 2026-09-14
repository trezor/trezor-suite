import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import {
    type RippleNetworkSymbol,
    isSupportedRippleNetwork,
    supportedRippleNetworks,
} from '@trezor/network-ripple/constants';

export type RippleSuiteNetworkModule = SuiteNetworkModule<RippleNetworkSymbol>;

export const createRippleSuiteNetworkModule = (): RippleSuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => supportedRippleNetworks,
    isSupportedNetwork: isSupportedRippleNetwork,
});
