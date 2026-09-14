import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import {
    type TronNetworkSymbol,
    isSupportedTronNetwork,
    supportedTronNetworks,
} from '@trezor/network-tron/constants';

export type TronSuiteNetworkModule = SuiteNetworkModule<TronNetworkSymbol>;

export const createTronSuiteNetworkModule = (): TronSuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => supportedTronNetworks,
    isSupportedNetwork: isSupportedTronNetwork,
});
