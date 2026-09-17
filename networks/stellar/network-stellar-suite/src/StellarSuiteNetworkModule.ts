import { asNetworkSymbols } from '@trezor/network-module';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { supportedStellarNetworks } from '@trezor/network-stellar/constants';

export const createStellarSuiteNetworkModule = (): SuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => asNetworkSymbols(supportedStellarNetworks),
});
