import { type TokenAddress, normalizeTokenAddress, toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';
import { type Branded } from '@trezor/type-utils';

/** Identifies a network's native asset or a specific token, independently of wallets and catalogues. */
export type AssetId = string & Branded<'AssetId'>;

type AssetReference = Readonly<{
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
}>;

export const createAssetId = ({ networkSymbol, contractAddress }: AssetReference): AssetId =>
    (contractAddress === undefined
        ? networkSymbol
        : `${networkSymbol}:${encodeURIComponent(normalizeTokenAddress(networkSymbol, contractAddress))}`) as AssetId;

/** Decodes identities created by createAssetId, preserving complete case-sensitive token identifiers. */
export const parseAssetId = (assetId: AssetId): AssetReference => {
    const separator = assetId.indexOf(':');
    if (separator === -1) {
        return { networkSymbol: asNetworkSymbol(assetId) };
    }

    return {
        networkSymbol: asNetworkSymbol(assetId.slice(0, separator)),
        contractAddress: toTokenAddress(decodeURIComponent(assetId.slice(separator + 1))),
    };
};
