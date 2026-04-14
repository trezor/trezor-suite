import {
    type NetworkSymbolExtended,
    getNetwork,
    getNetworkByCoingeckoId,
    getNetworkFeatures,
    isNetworkSymbol,
} from '@suite-common/wallet-config';

import { isNetworkSymbolWithIcon } from '../../constants/networks';

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
        isNetworkSymbolWithIcon(networkSymbol) &&
        isNetworkSymbol(networkSymbol) &&
        Boolean(contractAddress) &&
        getNetworkFeatures(networkSymbol).includes('tokens')
    );
}

export const getCoingeckoIdAndContractAddressIncludesNativeTokens = (
    coingeckoId: string,
    contractAddress: string[] | undefined,
) => {
    const mainNetworkSymbol = getNetworkByCoingeckoId(coingeckoId)?.displaySymbol.toLowerCase();

    const addresses = ([] as Array<string | undefined>)
        .concat(contractAddress ?? [])
        .map(addr => addr ?? ZERO_ADDRESS);

    const hasNative = addresses.some(addr => addr === ZERO_ADDRESS);

    const shouldUseTradeId = hasNative && !!mainNetworkSymbol && isNetworkSymbol(mainNetworkSymbol);

    const resolvedCoingeckoId = shouldUseTradeId
        ? (getNetwork(mainNetworkSymbol).tradeCryptoId ?? coingeckoId)
        : coingeckoId;

    return {
        coingeckoId: resolvedCoingeckoId,
        contractAddresses: addresses.length ? addresses : [ZERO_ADDRESS],
    };
};
