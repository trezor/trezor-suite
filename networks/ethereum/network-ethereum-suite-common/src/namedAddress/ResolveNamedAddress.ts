import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';

/**
 * Resolves a name to an address; null means no record, while backend failures reject.
 * @serviceContract
 */
export type ResolveNamedAddress = (
    value: string,
    symbol: EthereumNetworkSymbol,
) => Promise<string | null>;

export type ResolveNamedAddressDep = {
    resolveNamedAddress: ResolveNamedAddress;
};
