import { isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';
import {
    type NetworkSymbolExtended,
    getNetwork,
    getNetworkByCoingeckoId,
    getNetworkFeatures,
    isNetworkSymbol,
} from '@suite-common/wallet-config';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export type LogoCandidate = { address: string; src: string; srcSet: string };

export const resolvedLogoCache = new Map<string, LogoCandidate>();
export const failedAddressesCache = new Set<string>();

export const makeCacheKey = (coingeckoId: string, addressesKey: string) =>
    `${coingeckoId}::${addressesKey}`;

export const makeAddressKey = (coingeckoId: string, address: string) =>
    `${coingeckoId}::${address}`;

export function shouldShowNetworkIcon(
    networkSymbol?: NetworkSymbolExtended,
    contractAddress?: string | null,
) {
    return (
        networkSymbol &&
        isNetworkIconSymbol(networkSymbol) &&
        isNetworkSymbol(networkSymbol) &&
        Boolean(contractAddress) &&
        getNetworkFeatures(networkSymbol).includes('tokens')
    );
}

export const getCoingeckoIdAndContractAddressIncludesNativeTokens = (
    coingeckoId: string,
    contractAddress: string[] | undefined,
) => {
    const network = getNetworkByCoingeckoId(coingeckoId);
    const mainNetworkSymbol = network?.displaySymbol.toLowerCase();

    const addresses = ([] as Array<string | undefined>)
        .concat(contractAddress ?? [])
        .map(addr => addr ?? ZERO_ADDRESS);

    const hasNative = addresses.length === 0 || addresses.includes(ZERO_ADDRESS);

    const getNativeCoingeckoId = () => {
        if (network?.nativeAssetCryptoId) {
            return network.nativeAssetCryptoId;
        }

        if (mainNetworkSymbol && isNetworkSymbol(mainNetworkSymbol)) {
            return getNetwork(mainNetworkSymbol).tradeCryptoId ?? coingeckoId;
        }

        return coingeckoId;
    };

    return {
        coingeckoId: hasNative ? getNativeCoingeckoId() : coingeckoId,
        contractAddresses: addresses.length ? addresses : [ZERO_ADDRESS],
    };
};
