import { type NetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';

export const getNativeAssetIconSymbol = (networkSymbol: NetworkSymbol): NetworkSymbol =>
    getNetworkOptional(networkSymbol)?.settlementLayer ?? networkSymbol;
