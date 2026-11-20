import type { EthereumNetworkSymbol } from '@trezor/network-ethereum-types';
import type { NamedAddressResolveOptions } from '@trezor/network-module-suite-common-types';

/** @serviceContract */
export type ReverseResolveAddress = (
    symbol: EthereumNetworkSymbol,
    address: string,
    options?: NamedAddressResolveOptions,
) => Promise<string | null>;

export type ReverseResolveAddressDep = {
    reverseResolveAddress: ReverseResolveAddress;
};
