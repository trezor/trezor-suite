import { type NetworkSymbol } from '@trezor/network-module-types';
import { type Branded } from '@trezor/type-utils';

import { type TokenAddress, normalizeTokenAddress } from './Token';

/** Identifies a network's native token or a specific token, independently of wallets and catalogues. */
export type AssetId = Readonly<{
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
}>;

export type AssetKey = string & Branded<'AssetKey'>;

/** Canonical key for comparisons, collections and lists; the identity itself keeps its fields. */
export const getAssetKey = ({ networkSymbol, contractAddress }: AssetId): AssetKey =>
    (contractAddress === undefined
        ? networkSymbol
        : `${networkSymbol}:${encodeURIComponent(normalizeTokenAddress(contractAddress))}`) as AssetKey;
