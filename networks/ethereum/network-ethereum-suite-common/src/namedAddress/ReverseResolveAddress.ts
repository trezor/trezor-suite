import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';

/** @serviceContract */
export type ReverseResolveAddress = (
    address: string,
    symbol: EthereumNetworkSymbol,
) => Promise<string | null>;

export type ReverseResolveAddressDep = {
    reverseResolveAddress: ReverseResolveAddress;
};
