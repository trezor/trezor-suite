import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type { NamedAddressResolveOptions } from '@trezor/network-module-suite-common-types';

/**
 * Resolves a name to an address; null means no record, while backend failures reject.
 * @serviceContract
 */
export type ResolveNamedAddress = (
    value: string,
    symbol: EthereumNetworkSymbol,
    options?: NamedAddressResolveOptions,
) => Promise<string | null>;

export type ResolveNamedAddressDep = {
    resolveNamedAddress: ResolveNamedAddress;
};
