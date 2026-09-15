import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import {
    type StellarNetworkSymbol,
    isSupportedStellarNetwork,
    supportedStellarNetworks,
} from '@trezor/network-stellar/constants';

export type StellarSuiteNetworkModule = SuiteNetworkModule<StellarNetworkSymbol>;

export const createStellarSuiteNetworkModule = (): StellarSuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => supportedStellarNetworks,
    isSupportedNetwork: isSupportedStellarNetwork,
});
