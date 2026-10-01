import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type { NamedAddressResolveOptions } from '@trezor/network-module-suite-common-types';

/** @serviceContract */
export type ReverseResolveAddress = (
    address: string,
    symbol: EthereumNetworkSymbol,
    options?: NamedAddressResolveOptions,
) => Promise<string | null>;

export type ReverseResolveAddressDep = {
    reverseResolveAddress: ReverseResolveAddress;
};
