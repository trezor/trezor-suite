import { asNetworkSymbols } from '@trezor/network-module-types';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { supportedRippleNetworks } from '@trezor/network-ripple-types';

export const createRippleSuiteNetworkModule = (): SuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => asNetworkSymbols(supportedRippleNetworks),
});
