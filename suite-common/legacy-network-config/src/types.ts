import type { TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

export {
    TREZOR_CONNECT_BACKENDS,
    type AccountType,
    type BackendOption,
    type BackendType,
    type Explorer,
    type NetworkAccount,
    type NetworkFeature,
    type NetworkType,
    type ServerType,
    type TrezorConnectBackendType,
} from '@trezor/network-module-suite-common-types';

export type NetworkSymbol = string;

export type Network = Omit<SuiteCommonNetworkConfig, 'yieldXyzId' | 'color' | 'protocols'> & {
    symbol: NetworkSymbol;
    /**
     * Network ID used by Yield.xyz
     * @url https://yield.xyz
     */
    yieldXyzId: TokenDtoV2['network'] | null;
};
export type Networks = Record<NetworkSymbol, Network>;
