import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { asNetworkSymbols } from '@trezor/network-module-types';
import { supportedStellarNetworks } from '@trezor/network-stellar-types';

export const createStellarSuiteNetworkModule = (): SuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => asNetworkSymbols(supportedStellarNetworks),
});
