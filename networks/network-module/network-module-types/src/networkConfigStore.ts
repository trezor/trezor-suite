import type { NetworkSymbol } from './networkSymbol';

export type NetworkConfig = {
    readonly name: string;
    readonly displaySymbol?: string;
    readonly features?: readonly string[];
    readonly settlementLayer?: NetworkSymbol;
    readonly coingeckoId?: string;
    readonly tradeCryptoId?: string;
    readonly nativeAssetCryptoId?: string;
};

export type NetworkConfigs = Readonly<Record<NetworkSymbol, NetworkConfig>> | null;

export type NetworkConfigState = {
    readonly networks: NetworkConfigs;
};
