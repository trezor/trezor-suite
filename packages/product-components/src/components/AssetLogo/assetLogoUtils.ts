import { getNetwork, getNetworkByCoingeckoId, isNetworkSymbol } from '@suite-common/wallet-config';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export type LogoCandidate = { address: string; src: string; srcSet: string };

export const resolvedLogoCache = new Map<string, LogoCandidate>();
export const failedAddressesCache = new Set<string>();

export const makeCacheKey = (coingeckoId: string, addressesKey: string) =>
    `${coingeckoId}::${addressesKey}`;

export const makeAddressKey = (coingeckoId: string, address: string) =>
    `${coingeckoId}::${address}`;

export const getCoingeckoIdAndContractAddressIncludesNativeTokens = (
    coingeckoId: string,
    contractAddress: string[] | undefined,
) => {
    const mainNetworkSymbol = getNetworkByCoingeckoId(coingeckoId)?.displaySymbol.toLowerCase();

    const addresses = ([] as Array<string | undefined>)
        .concat(contractAddress ?? [])
        .map(addr => addr ?? ZERO_ADDRESS);

    const hasNative = addresses.length === 0 || addresses.includes(ZERO_ADDRESS);

    const shouldUseTradeId = hasNative && !!mainNetworkSymbol && isNetworkSymbol(mainNetworkSymbol);

    const resolvedCoingeckoId = shouldUseTradeId
        ? (getNetwork(mainNetworkSymbol).tradeCryptoId ?? coingeckoId)
        : coingeckoId;

    return {
        coingeckoId: resolvedCoingeckoId,
        contractAddresses: addresses.length ? addresses : [ZERO_ADDRESS],
    };
};
