import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type WrappedNativeToken = {
    address: string;
    symbol: string;
    decimals: number;
};

export const wrappedNativeToTokenMetadataSources = (
    networkSymbol: NetworkSymbol,
    wrappedNative: WrappedNativeToken,
): TokenMetadataSource[] => [
    {
        networkSymbol,
        tokens: [
            {
                contract: toTokenAddress(wrappedNative.address),
                symbol: wrappedNative.symbol,
                decimals: wrappedNative.decimals,
            },
        ],
    },
];
