import type {
    NetworkConfig as BaseNetworkConfig,
    NetworkSymbol,
} from '@trezor/network-module-types';

/**
 * Keep the config fields a subset of SuiteCommonNetworkConfig so wallet metadata can be
 * passed directly and other apps can provide only the fields needed for network display.
 */
export type NetworkConfig = BaseNetworkConfig & {
    readonly symbol: NetworkSymbol;
};
