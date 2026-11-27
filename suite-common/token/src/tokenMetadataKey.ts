import { type TokenAddress, toTokenAddress } from '@suite-common/tokens';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { type NetworkSymbol } from '@trezor/network-module-types';

/**
 * EVM backends and APIs disagree on contract casing (checksummed vs lowercased), so metadata is
 * keyed by the network's canonical form; other networks keep their case-sensitive identifiers.
 */
export const getTokenMetadataKey = (networkSymbol: NetworkSymbol, contract: string): TokenAddress =>
    toTokenAddress(getContractAddressForNetworkSymbol(networkSymbol, contract));
