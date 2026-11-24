import { type TokenAddress, normalizeTokenAddress, toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';
import { type Branded } from '@trezor/type-utils';

/**
 * Identifies a NativeToken or Token on a specific network, independently of wallets and catalogues.
 * Native tokens use the NetworkSymbol; tokens use NetworkSymbol:TokenAddress.
 * EVM contract addresses are lowercased; case-sensitive token identifiers retain their spelling.
 *
 * @see https://github.com/trezor/trezor-suite/blob/develop/docs/ubiquitous-language.md
 */
export type AssetId = string & Branded<'AssetId'>;

type AssetReference = Readonly<{
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
}>;

export const createAssetId = ({ networkSymbol, contractAddress }: AssetReference): AssetId =>
    (contractAddress === undefined
        ? networkSymbol
        : `${networkSymbol}:${normalizeTokenAddress(networkSymbol, contractAddress)}`) as AssetId;

/**
 * Decodes an identity created by createAssetId. EVM addresses remain lowercase; parsing does not
 * recover the original address casing from account or catalogue metadata.
 */
export const parseAssetId = (assetId: AssetId): AssetReference => {
    const separator = assetId.indexOf(':');
    if (separator === -1) {
        return { networkSymbol: asNetworkSymbol(assetId) };
    }

    return {
        networkSymbol: asNetworkSymbol(assetId.slice(0, separator)),
        contractAddress: toTokenAddress(assetId.slice(separator + 1)),
    };
};
