import type { EthereumNetworkSymbol } from '@trezor/network-ethereum-types';
import type { NamedAddressResolveOptions } from '@trezor/network-module-suite-common-types';

/**
 * Resolves a name to an address; null means no record, while backend failures reject.
 * @serviceContract
 */
export type ResolveNamedAddress = (
    symbol: EthereumNetworkSymbol,
    value: string,
    options?: NamedAddressResolveOptions,
) => Promise<string | null>;

export type ResolveNamedAddressDep = {
    resolveNamedAddress: ResolveNamedAddress;
};
